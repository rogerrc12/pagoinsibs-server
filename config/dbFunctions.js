const db = require("./db");
// MODELS
const User = require("../models/user");
const Account = require("../models/account");
const ThirdPartyAccount = require("../models/thirdPartyAccount");
const Product = require("../models/admin/product");
const Status = require("../models/status");
const AccPayment = require("../models/accPayment");
const CcPayment = require("../models/ccPayment");
const Debit = require("../models/debit");
const FeeControl = require("../models/feeControl");
// ADMIN MODELS
const AdminUser = require("../models/admin/adminUser");
const Role = require("../models/admin/role");
const Bank = require("../models/admin/bank");
const Supplier = require("../models/admin/supplier");
const SupplierType = require("../models/admin/supplierType");
const SupplierBank = require("../models/admin/supplierBank");
const Correlative = require("../models/admin/correlative");
const BankPayment = require("../models/admin/bankPayment");

module.exports = {
  relateTables: async () => {
    User.belongsTo(Role);
    User.hasMany(Account);
    User.hasMany(ThirdPartyAccount);
    User.hasMany(AccPayment);
    User.hasMany(Debit);
    Account.belongsTo(Bank);
    Account.belongsTo(User);
    Supplier.belongsTo(SupplierType);
    SupplierBank.belongsTo(Supplier);
    SupplierBank.belongsTo(Bank);
    Product.belongsTo(Supplier);
    Supplier.hasMany(Product);
    Debit.belongsTo(User);
    Debit.belongsTo(Supplier);
    Debit.belongsTo(Product);
    Debit.belongsTo(Status);
    Debit.hasMany(FeeControl);
    FeeControl.belongsTo(Debit);
    FeeControl.belongsTo(Status);
    AccPayment.belongsTo(User);
    AccPayment.belongsTo(Supplier);
    AccPayment.belongsTo(Status);
    CcPayment.belongsTo(User);
    CcPayment.belongsTo(Supplier);
    CcPayment.belongsTo(Status);
    AdminUser.belongsTo(Role);
    BankPayment.belongsTo(Correlative, { foreignKey: "correlativeId", targetKey: "correlative" });
    Correlative.hasMany(BankPayment, { sourceKey: "correlative", foreignKey: "correlativeId" });
    BankPayment.belongsTo(User);
    BankPayment.belongsTo(FeeControl, { as: "fee" });
    BankPayment.belongsTo(AccPayment, { as: "payment" });
    BankPayment.belongsTo(Bank);
  },

  createSequencesTables: async () => {
    await db.query("CREATE SEQUENCE IF NOT EXISTS correlative_seq start 1000 increment 1 minvalue 1000");
    await db.query("CREATE SEQUENCE IF NOT EXISTS debits_seq start 1000 increment 1 minvalue 1000");
    await db.query("CREATE SEQUENCE IF NOT EXISTS accPayments_id_seq start 1000 increment 1 minvalue 1000");
    await db.query("CREATE SEQUENCE IF NOT EXISTS ccPayments_id_seq start 1000 increment 1 minvalue 1000");

    await db.query("ALTER TABLE correlatives ALTER COLUMN correlative SET DEFAULT nextval('correlative_seq')");
    await db.query("ALTER TABLE debits ALTER COLUMN id SET DEFAULT nextval('debits_seq')");
    await db.query(`ALTER TABLE "accPayments" ALTER COLUMN id SET DEFAULT nextval('accPayments_id_seq')`);
    await db.query(`ALTER TABLE "ccPayments" ALTER COLUMN id SET DEFAULT nextval('ccPayments_id_seq')`);

    await db.query("ALTER SEQUENCE IF EXISTS registerId_seq OWNED BY correlatives.correlative");
    await db.query("ALTER SEQUENCE IF EXISTS debits_seq OWNED BY debits.id");
    await db.query(`ALTER SEQUENCE IF EXISTS accPayments_id_seq OWNED BY "accPayments".id`);
    await db.query(`ALTER SEQUENCE IF EXISTS ccPayments_id_seq OWNED BY "ccPayments".id`);
  },
};
