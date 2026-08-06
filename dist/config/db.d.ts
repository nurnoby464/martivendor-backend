import mongoose from 'mongoose';
interface MongoCache {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
}
declare global {
    var _mongoCache: MongoCache | undefined;
}
declare const connectDB: () => Promise<mongoose.Connection>;
export default connectDB;
//# sourceMappingURL=db.d.ts.map