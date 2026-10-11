import { model, Schema } from "mongoose";
 
const CounterSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
  },
  { collection: "counters" },
);
 
export const Counter = model("Counter", CounterSchema);

export const nextSequence = async (key: string): Promise<number> => {
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  if (!doc) throw new Error(`Failed to generate sequence for ${key}`);
  return doc.seq;
};