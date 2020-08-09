const User = require('../../models/user')
const Account = require('../../models/account')
const AccPayment = require('../../models/accPayment');
const Bank = require('../../models/admin/bank');
const Status = require('../../models/status');

const getSubscribers = async (req, res, next) => {
  try {
    const users = await User.findAll();
    return res.status(200).json(users);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
} 

const getProfile = async (req, res ,next) => {
  const { id } = req.params;
  
  try {
    const user = await User.findByPk(id, { include: [{model: Account, include: Bank}, {model: AccPayment, include: Status}] });
    const profile = {
      information: user, accounts: user.accounts, payments: user.accPayments
    }
    
    return res.status(200).json(profile);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
}

module.exports = {
  getSubscribers,
  getProfile
  //
  // getProfileCcPayments: async id => {
  //   return await db('users_tdc_payments as uccp')
  //     .select('uccp.id', 'uccp.description', 'uccp.amount', 's.name', 'uccp.date_issued', 'ts.status_name as status')
  //     .join('suppliers as s', { 's.id' : 'uccp.supplier_id' })
  //     .join('transaction_status as ts', { 'ts.id' : 'uccp.status_id' })
  //     .where({ 'uccp.user_id': id });
  // },
  //
  // getProfileAccPayments: async id => {
  //   return await db('users_acc_payments as uap')
  //     .select('uap.id', 'uap.description', 'uap.amount', 's.name', 'uap.date_issued', 'ts.status_name as status')
  //     .join('suppliers as s', { 's.id' : 'uap.supplier_id' })
  //     .join('transaction_status as ts', { 'ts.id' : 'uap.status_id' })
  //     .where({ 'uap.user_id': id });
  // },
  //
  // getProfileTransfers: async id => {
  //   return await db('users_transfers as ut')
  //     .select('ut.id', 'ut.description', 'ut.amount', 'u.first_name', 'u.last_name', 'u.pay_id', 'ut.date_issued', 'ts.status_name as status')
  //     .join('users as u', { 'u.id' : 'ut.user_received_id' })
  //     .join('transaction_status as ts', { 'ts.id' : 'ut.status_id' })
  //     .where({ 'ut.user_id' : id })
  // },
  //
  // getProfileAccToSend: async id => {
  //   return await db('accounts_to_send as as')
  //     .select('as.id', 'as.acc_number', 'b.bank_name', 'as.acc_type')
  //     .join('banks as b', { 'as.bank_id':'b.bank_id' })
  //     .where({ user_id: id })
  // },
  //
  // getProfileAccToReceive: async id => {
  //   return await db('accounts_to_receive as ar')
  //     .select('ar.id', 'ar.acc_number', 'b.bank_name', 'ar.acc_type')
  //     .join('banks as b', { 'ar.bank_id':'b.bank_id' })
  //     .where({ user_id: id })
  // }
}