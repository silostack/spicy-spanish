import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { EbookController } from "./ebook.controller";
import { EbookSubscriber } from "./entities/ebook-subscriber.entity";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [MikroOrmModule.forFeature([EbookSubscriber]), EmailModule],
  controllers: [EbookController],
})
export class EbookModule {}
