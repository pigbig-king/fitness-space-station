import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateConversationDto } from './dto/create-conversation.dto'
import { SendMessageDto } from './dto/send-message.dto'

const userSelect = { id: true, nickname: true, avatarUrl: true }

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async listConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { OR: [{ participant1Id: userId }, { participant2Id: userId }] },
      include: {
        participant1: { select: userSelect },
        participant2: { select: userSelect },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })
    const unread = await this.prisma.message.findMany({
      where: {
        read: false,
        senderId: { not: userId },
        conversation: { OR: [{ participant1Id: userId }, { participant2Id: userId }] },
      },
      select: { conversationId: true },
    })
    const unreadMap = new Map<string, number>()
    for (const m of unread) unreadMap.set(m.conversationId, (unreadMap.get(m.conversationId) ?? 0) + 1)

    const items = conversations
      .map((c) => {
        const other = c.participant1Id === userId ? c.participant2 : c.participant1
        const lastMessage = c.messages[0] ?? null
        return {
          id: c.id,
          other,
          lastMessage,
          unreadCount: unreadMap.get(c.id) ?? 0,
          updatedAt: lastMessage?.createdAt ?? c.createdAt,
        }
      })
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    return items
  }

  async listMessages(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participant1: { select: userSelect }, participant2: { select: userSelect } },
    })
    if (!conversation || (conversation.participant1Id !== userId && conversation.participant2Id !== userId)) {
      throw new NotFoundException('会话不存在')
    }
    await this.prisma.message.updateMany({
      where: { conversationId, read: false, senderId: { not: userId } },
      data: { read: true },
    })
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: userSelect } },
      orderBy: { createdAt: 'asc' },
    })
    const other = conversation.participant1Id === userId ? conversation.participant2 : conversation.participant1
    return { other, messages }
  }

  async createConversation(userId: string, dto: CreateConversationDto) {
    if (userId === dto.userId) throw new BadRequestException('不能和自己私信')
    const other = await this.prisma.user.findUnique({ where: { id: dto.userId } })
    if (!other) throw new NotFoundException('用户不存在')
    const [p1, p2] = userId < dto.userId ? [userId, dto.userId] : [dto.userId, userId]
    return this.prisma.conversation.upsert({
      where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
      update: {},
      create: { participant1Id: p1, participant2Id: p2 },
    })
  }

  async sendMessage(userId: string, conversationId: string, dto: SendMessageDto) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } })
    if (!conversation || (conversation.participant1Id !== userId && conversation.participant2Id !== userId)) {
      throw new NotFoundException('会话不存在')
    }
    return this.prisma.message.create({
      data: { conversationId, senderId: userId, content: dto.content },
      include: { sender: { select: userSelect } },
    })
  }

  unreadCount(userId: string) {
    return this.prisma.message.count({
      where: {
        read: false,
        senderId: { not: userId },
        conversation: { OR: [{ participant1Id: userId }, { participant2Id: userId }] },
      },
    })
  }
}
