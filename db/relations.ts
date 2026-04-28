import { relations } from "drizzle-orm";
import { users, departments, documents, tasks, appointments, appointmentParticipants, notifications } from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  createdDocuments: many(documents),
  createdTasks: many(tasks),
  assignedTasks: many(tasks),
  createdAppointments: many(appointments),
  appointmentParticipations: many(appointmentParticipants),
  notifications: many(notifications),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
  documents: many(documents),
  tasks: many(tasks),
  appointments: many(appointments),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  creator: one(users, {
    fields: [documents.createdBy],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [documents.departmentId],
    references: [departments.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [tasks.departmentId],
    references: [departments.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  creator: one(users, {
    fields: [appointments.createdBy],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [appointments.departmentId],
    references: [departments.id],
  }),
  participants: many(appointmentParticipants),
}));

export const appointmentParticipantsRelations = relations(appointmentParticipants, ({ one }) => ({
  appointment: one(appointments, {
    fields: [appointmentParticipants.appointmentId],
    references: [appointments.id],
  }),
  user: one(users, {
    fields: [appointmentParticipants.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
