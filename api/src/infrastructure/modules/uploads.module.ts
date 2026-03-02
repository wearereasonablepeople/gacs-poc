import { Module } from "@nestjs/common";
import { UploadsController } from "../../ui/controllers/uploads.controller";

@Module({
  controllers: [UploadsController],
})
export class UploadsFeatureModule {}
