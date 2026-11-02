import mongoose from 'mongoose';
import { GENDERS, BRAZIL_STATES } from './profile.js';
const { Schema, model } = mongoose;
const opts = { timestamps: true, versionKey: false };
const User = model(
  'User',
  new Schema(
    {
      name: { type: String, required: true, trim: true, maxlength: 120 },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        maxlength: 254,
      },
      birthDate: { type: String, default: null },
      gender: { type: String, enum: [...GENDERS, null], default: null },
      genderDescription: { type: String, trim: true, maxlength: 120, default: '' },
      specialty: { type: String, trim: true, maxlength: 120, default: '' },
      crm: { type: String, trim: true, maxlength: 10, default: '' },
      crmUf: { type: String, enum: [...BRAZIL_STATES, ''], default: '' },
      passwordHash: { type: String, required: true },
      role: { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
    },
    opts,
  ),
);
const SessionSchema = new Schema(
  {
    tokenHash: { type: String, unique: true, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { versionKey: false },
);
const Session = model('Session', SessionSchema);
const PrepSchema = new Schema(
  {
    reason: { type: String, required: true, maxlength: 500 },
    symptoms: { type: String, required: true, maxlength: 4000 },
    questions: { type: String, default: '', maxlength: 4000 },
    meds: { type: String, default: '', maxlength: 4000 },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false, versionKey: false },
);
const AppointmentSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, required: true },
    date: { type: String, default: null },
    time: { type: String, default: null },
    status: {
      type: String,
      enum: ['Solicitada', 'Aceito', 'Remarcação solicitada', 'Concluída', 'Cancelada'],
      default: 'Solicitada',
    },
    requestedDate: { type: String, default: null },
    requestedTime: { type: String, default: null },
    rescheduleNote: { type: String, default: '' },
    prep: { type: PrepSchema, required: true },
    legacyKey: { type: String, unique: true, sparse: true },
  },
  opts,
);
// A restrição é garantida pelo próprio MongoDB mesmo com dois médicos / abas concorrendo.
AppointmentSchema.index(
  { doctorId: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { status: 'Aceito' } },
);
AppointmentSchema.index({ patientId: 1, createdAt: -1 });
const Appointment = model('Appointment', AppointmentSchema);
const Followup = model(
  'Followup',
  new Schema(
    {
      patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      text: { type: String, required: true, maxlength: 2000 },
      legacyKey: { type: String, unique: true, sparse: true },
    },
    opts,
  ),
);
const Guidance = model(
  'Guidance',
  new Schema(
    {
      patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      text: { type: String, required: true, maxlength: 4000 },
      meds: { type: String, default: '', maxlength: 1000 },
      returnDate: { type: String, default: null },
      legacyKey: { type: String, unique: true, sparse: true },
    },
    opts,
  ),
);
export { User, Session, Appointment, Followup, Guidance };
