import { IWalletTransactionDocument } from "./walletTransaction.interface";
declare const WalletTransaction: import("mongoose").Model<IWalletTransactionDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IWalletTransactionDocument, {}, import("mongoose").DefaultSchemaOptions> & IWalletTransactionDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IWalletTransactionDocument>;
export default WalletTransaction;
//# sourceMappingURL=walletTransaction.schema.d.ts.map