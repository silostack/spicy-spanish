import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EntityManager, EntityRepository } from "@mikro-orm/core";
import { InjectRepository } from "@mikro-orm/nestjs";
import { Course } from "../courses/entities/course.entity";
import { Appointment, AppointmentStatus } from "./entities/appointment.entity";

@Injectable()
export class AppointmentGeneratorService {
  private readonly logger = new Logger(AppointmentGeneratorService.name);

  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: EntityRepository<Course>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: EntityRepository<Appointment>,
    private readonly em: EntityManager,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async generateAppointments() {
    this.logger.log("Starting appointment generation...");

    const courses = await this.courseRepository.find(
      { isActive: true },
      { populate: ["tutor", "students", "schedules"] },
    );

    for (const course of courses) {
      const schedules = course.schedules.getItems();
      if (schedules.length === 0) continue;

      const students = course.students.getItems();
      if (students.length === 0) continue;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const fourWeeksOut = new Date(today);
      fourWeeksOut.setDate(fourWeeksOut.getDate() + 28);

      const courseStart = new Date(course.startDate);
      courseStart.setHours(0, 0, 0, 0);

      const appointmentsToCreate: Appointment[] = [];

      for (const schedule of schedules) {
        // Walk each day from today (or course start, whichever is later) to 4 weeks out
        const start = courseStart > today ? courseStart : today;
        const current = new Date(start);

        while (current <= fourWeeksOut) {
          if (current.getDay() === schedule.dayOfWeek) {
            // Build the appointment start/end times
            const [startH, startM] = schedule.startTime.split(":").map(Number);
            const [endH, endM] = schedule.endTime.split(":").map(Number);

            const appointmentStart = new Date(current);
            appointmentStart.setHours(startH, startM, 0, 0);

            const appointmentEnd = new Date(current);
            appointmentEnd.setHours(endH, endM, 0, 0);

            // Skip if appointment already exists for this course + time
            const existing = await this.appointmentRepository.count({
              course: course.id,
              startTime: appointmentStart,
              status: { $ne: AppointmentStatus.CANCELLED },
            });

            if (existing === 0) {
              const appointment = new Appointment(
                course.tutor,
                course,
                appointmentStart,
                appointmentEnd,
              );
              for (const student of students) {
                appointment.students.add(student);
              }

              appointmentsToCreate.push(appointment);

              // Deduct hours
              const durationHours =
                (appointmentEnd.getTime() - appointmentStart.getTime()) /
                (1000 * 60 * 60);
              course.hoursBalance = Number(course.hoursBalance) - durationHours;
            }
          }

          current.setDate(current.getDate() + 1);
        }
      }

      if (appointmentsToCreate.length > 0) {
        await this.em.persistAndFlush(appointmentsToCreate);

        if (course.hoursBalance <= 0) {
          course.needsRenewal = true;
        } else {
          course.needsRenewal = false;
        }
        await this.em.flush();

        this.logger.log(
          `Generated ${appointmentsToCreate.length} appointments for course "${course.title}"`,
        );
      }
    }

    this.logger.log("Appointment generation complete.");
  }
}
