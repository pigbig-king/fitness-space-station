-- AlterTable
ALTER TABLE "Gym" ADD COLUMN     "environment" TEXT;

-- AlterTable
ALTER TABLE "GymEquipment" ADD COLUMN     "professionalName" TEXT,
ADD COLUMN     "serialLabel" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'NORMAL';

-- CreateTable
CREATE TABLE "GymEquipmentReview" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GymEquipmentReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GymEquipmentReview_equipmentId_userId_key" ON "GymEquipmentReview"("equipmentId", "userId");

-- AddForeignKey
ALTER TABLE "GymEquipmentReview" ADD CONSTRAINT "GymEquipmentReview_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "GymEquipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymEquipmentReview" ADD CONSTRAINT "GymEquipmentReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
