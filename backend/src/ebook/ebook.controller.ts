import {
  Controller,
  Post,
  Body,
  Logger,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { IsEmail, IsNotEmpty } from "class-validator";
import { EntityManager } from "@mikro-orm/core";
import { EmailService } from "../email/email.service";
import { EbookSubscriber } from "./entities/ebook-subscriber.entity";

class EbookSubscribeDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

@Controller("ebook")
export class EbookController {
  private readonly logger = new Logger(EbookController.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly em: EntityManager,
  ) {}

  @Post("subscribe")
  @HttpCode(HttpStatus.OK)
  async subscribe(@Body() dto: EbookSubscribeDto) {
    this.logger.log(`Ebook subscription from ${dto.email}`);

    // Check if already subscribed
    const existing = await this.em.findOne(EbookSubscriber, {
      email: dto.email,
    });

    if (!existing) {
      const subscriber = new EbookSubscriber();
      subscriber.email = dto.email;
      this.em.persist(subscriber);
      await this.em.flush();
    }

    try {
      await this.emailService.sendEbookDownloadEmail(dto.email);
    } catch (error) {
      this.logger.error(
        `Failed to send ebook download email: ${error.message}`,
      );
    }

    return {
      message: "Check your email for the download link!",
    };
  }
}
