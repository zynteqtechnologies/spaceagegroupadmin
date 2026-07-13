import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITimelineEvent extends Document {
  year: string;
  title: string;
  description: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineEventSchema = new Schema<ITimelineEvent>({
  year: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

if (mongoose.models.TimelineEvent) {
  delete (mongoose.models as any).TimelineEvent;
}

const TimelineEvent: Model<ITimelineEvent> = mongoose.model<ITimelineEvent>('TimelineEvent', TimelineEventSchema);
export default TimelineEvent;
