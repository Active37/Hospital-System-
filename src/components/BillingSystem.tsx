import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DollarSign, Plus, Eye, Receipt, FileCheck, Landmark, CheckCircle, Percent, AlertCircle, CreditCard, Sparkles, Building, CalendarRange, Printer } from 'lucide-react';
import { Invoice, InvoiceItem } from '../types';

interface BillingSystemProps {
  invoices: Invoice[];
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'date'>) => void;
  onPayInvoice: (id: string, amount: number) => void;
  onFileClaim: (id: string, provider: string, policy: string) => void;
  onSetupPaymentPlan: (id: string, months: number) => void;
}

export default function BillingSystem({
  invoices,
  onAddInvoice,
  onPayInvoice,
  onFileClaim,
  onSetupPaymentPlan,
}: BillingSystemProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  
  // Modals / workflows
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isFilingClaim, setIsFilingClaim] = useState(false);
  const [isSettingPlan, setIsSettingPlan] = useState(false);

  const handlePrintInvoice = (inv: Invoice) => {
    setPrintInvoice(inv);
    document.body.classList.add('printing-invoice');
    document.body.classList.remove('printing-summary');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Form states - Create Invoice
  const [newPatientName, setNewPatientName] = useState('James Cole');
  const [newPatientId, setNewPatientId] = useState('CG-20267');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [createdItems, setCreatedItems] = useState<Omit<InvoiceItem, 'id'>[]>([]);
  const [insuranceCoverPercent, setInsuranceCoverPercent] = useState('50'); // e.g., 50%
  const [insuranceProviderInput, setInsuranceProviderInput] = useState('Blue Cross Shield');

  // Payment states
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [paySuccess, setPaySuccess] = useState(false);
  const [payError, setPayError] = useState('');

  // Claim Filing states
  const [claimProvider, setClaimProvider] = useState('Blue Cross Shield');
  const [policyNum, setPolicyNum] = useState('POL-9023418');

  // Payment Plan states
  const [planMonths, setPlanMonths] = useState('3');

  // Calculate totals for financial report
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalReceived = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const totalInsurance = invoices.reduce((sum, inv) => sum + inv.insuranceCoverage, 0);
  const totalOutstanding = totalBilled - totalReceived - totalInsurance;

  const handleAddItemToInvoice = () => {
    if (!itemDesc || !itemPrice) return;
    const priceNum = parseFloat(itemPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    setCreatedItems([...createdItems, { description: itemDesc, amount: priceNum }]);
    setItemDesc('');
    setItemPrice('');
  };

  const handleRemoveItemFromInvoice = (index: number) => {
    setCreatedItems(createdItems.filter((_, idx) => idx !== index));
  };

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (createdItems.length === 0) return;

    const total = createdItems.reduce((sum, item) => sum + item.amount, 0);
    const coverPercentNum = parseFloat(insuranceCoverPercent) / 100;
    const insuranceAmt = total * coverPercentNum;
    const patientAmt = total - insuranceAmt;

    const invoiceItems: InvoiceItem[] = createdItems.map((item, idx) => ({
      ...item,
      id: `item-${Date.now()}-${idx}`,
    }));

    onAddInvoice({
      patientId: newPatientId,
      patientName: newPatientName,
      items: invoiceItems,
      totalAmount: total,
      insuranceCoverage: insuranceAmt,
      patientResponsibility: patientAmt,
      amountPaid: 0,
      status: insuranceAmt > 0 ? 'pending_insurance' : 'unpaid',
      insuranceProvider: insuranceProviderInput || undefined,
      insuranceClaimStatus: insuranceAmt > 0 ? 'filed' : 'not_filed',
    });

    setIsCreatingInvoice(false);
    setCreatedItems([]);
  };

  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayAmount(String(inv.patientResponsibility - inv.amountPaid));
    setIsPaying(true);
    setPaySuccess(false);
    setPayError('');
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0 || amt > (selectedInvoice.patientResponsibility - selectedInvoice.amountPaid)) {
      setPayError('Please enter a valid payment amount not exceeding balance.');
      return;
    }

    if (!cardNumber || cardNumber.length < 16) {
      setPayError('Please enter a valid 16-digit card number.');
      return;
    }

    onPayInvoice(selectedInvoice.id, amt);
    setPaySuccess(true);
    setTimeout(() => {
      setIsPaying(false);
      setPaySuccess(false);
      setSelectedInvoice(null);
      setCardName('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
    }, 2000);
  };

  const handleFileClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    onFileClaim(selectedInvoice.id, claimProvider, policyNum);
    setIsFilingClaim(false);
  };

  const handleSetupPlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    onSetupPaymentPlan(selectedInvoice.id, parseInt(planMonths));
    setIsSettingPlan(false);
  };

  return (
    <div id="billing-system-section" className="bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 tracking-tight">Financial Claims & Billing</h3>
            <p className="text-xs text-slate-500">Invoices, insurance, and interest-free payments</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreatingInvoice(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Generate Invoice
        </button>
      </div>

      {/* Financial Metrics Summary Banner */}
      <div className="p-5 bg-indigo-50/40 border-b border-slate-100 grid grid-cols-4 gap-4 text-center">
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase">Gross Billed</span>
          <span className="text-base font-bold text-slate-800">${totalBilled.toFixed(2)}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase">Settled</span>
          <span className="text-base font-bold text-emerald-600">${totalReceived.toFixed(2)}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase">Ins. Covered</span>
          <span className="text-base font-bold text-indigo-600">${totalInsurance.toFixed(2)}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase">Outstand Dues</span>
          <span className="text-base font-bold text-rose-600">${totalOutstanding.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 divide-y xl:divide-y-0 xl:divide-x divide-slate-100 flex-1">
        {/* Invoices List (Cols 3) */}
        <div className="xl:col-span-3 p-5 flex flex-col gap-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">All Financial Ledgers</h4>
          
          <div className="flex-1 overflow-y-auto max-h-[300px] pr-1 space-y-2.5">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className={`p-3.5 border rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                  selectedInvoice?.id === inv.id
                    ? 'bg-indigo-50/30 border-indigo-500 shadow-2xs'
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                }`}
              >
                <div className="min-w-0 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{inv.patientName}</h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                        inv.status === 'paid' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                        inv.status === 'pending_insurance' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                        inv.status === 'partially_paid' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                        'bg-rose-50 border-rose-200 text-rose-600'
                      }`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                      Inv ID: {inv.id} | Billed Date: {inv.date}
                    </p>
                    <div className="flex gap-2 flex-wrap mt-1">
                      {inv.paymentPlan && (
                        <span className="text-[9px] bg-indigo-50 text-indigo-600 font-semibold px-1.5 py-0.2 rounded border border-indigo-100">
                          💳 Plan: {inv.paymentPlan.monthsPaid}/{inv.paymentPlan.totalMonths} months
                        </span>
                      )}
                      {inv.insuranceProvider && (
                        <span className="text-[9px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.2 rounded border">
                          🏢 {inv.insuranceProvider} ({inv.insuranceClaimStatus})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount Details & Print Button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 text-right shrink-0">
                  <div>
                    <span className="block text-[13px] font-extrabold text-slate-800">
                      ${inv.totalAmount.toFixed(2)}
                    </span>
                    <span className="block text-[9px] text-slate-400 font-bold">
                      Bal Due: ${(inv.patientResponsibility - inv.amountPaid).toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintInvoice(inv);
                    }}
                    className="p-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 hover:border-indigo-100 rounded-lg border border-slate-100 transition duration-150 cursor-pointer flex items-center justify-center shrink-0"
                    title="Print Medical Invoice Statement"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Itemized Details Panel (Cols 2) */}
        <div className="xl:col-span-2 p-5 bg-slate-50/50 flex flex-col h-full justify-between">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Itemized Statement & Actions
            </h4>

            {selectedInvoice ? (
              <div className="space-y-4">
                <div className="bg-white p-4 border border-slate-100 rounded-xl space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase">Statement To</h5>
                      <span className="text-xs font-extrabold text-slate-700">{selectedInvoice.patientName}</span>
                    </div>
                    <div className="text-right">
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase">Invoice</h5>
                      <span className="text-xs font-bold text-slate-700">{selectedInvoice.id}</span>
                    </div>
                  </div>

                  {/* Itemized List */}
                  <div className="space-y-1.5">
                    {selectedInvoice.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                        <span>{item.description}</span>
                        <span className="font-semibold text-slate-800">${item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Calculation Details */}
                  <div className="border-t border-slate-100 pt-2 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Total Invoice</span>
                      <span>${selectedInvoice.totalAmount.toFixed(2)}</span>
                    </div>
                    {selectedInvoice.insuranceCoverage > 0 && (
                      <div className="flex justify-between text-indigo-500 font-medium">
                        <span>Insurance coverage ({selectedInvoice.insuranceProvider})</span>
                        <span>-${selectedInvoice.insuranceCoverage.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-800 font-bold border-t border-slate-50 pt-1 text-xs">
                      <span>Patient Responsibility</span>
                      <span>${selectedInvoice.patientResponsibility.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Amount Paid</span>
                      <span>-${selectedInvoice.amountPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-bold border-t border-slate-50 pt-1 text-xs">
                      <span>Outstanding Balance</span>
                      <span>${(selectedInvoice.patientResponsibility - selectedInvoice.amountPaid).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Patient Payment Controls */}
                <div className="space-y-2">
                  {selectedInvoice.patientResponsibility - selectedInvoice.amountPaid > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenPayment(selectedInvoice)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Pay Balance
                      </button>

                      {!selectedInvoice.paymentPlan && (
                        <button
                          onClick={() => { setIsSettingPlan(true); setIsPaying(false); setIsFilingClaim(false); }}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CalendarRange className="w-3.5 h-3.5" />
                          Installments
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-medium">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>This itemized ledger has been completely settled.</span>
                    </div>
                  )}

                  {/* Print & Insurance action buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => handlePrintInvoice(selectedInvoice)}
                      className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      Print Statement
                    </button>

                    {selectedInvoice.insuranceClaimStatus === 'not_filed' ? (
                      <button
                        onClick={() => { setIsFilingClaim(true); setIsPaying(false); setIsSettingPlan(false); }}
                        className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        File Insurance Claim
                      </button>
                    ) : (
                      <div className="text-[10px] text-slate-400 font-medium border border-slate-100 bg-slate-50/50 rounded-lg flex items-center justify-center px-2 py-2">
                        Claim {selectedInvoice.insuranceClaimStatus}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white border border-dashed border-slate-200 rounded-2xl">
                <Receipt className="w-8 h-8 text-slate-300 stroke-[1.5] mb-2" />
                <p className="text-xs text-slate-500 font-medium">No Statement Selected</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Select an invoice ledger on the left to review itemized charges, settle balances, file insurance, or split into payments.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pay Invoice Dialog */}
      <AnimatePresence>
        {isPaying && selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full p-5 space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-slate-800">Secure Payment Terminal</h4>
                </div>
                <button onClick={() => setIsPaying(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              {paySuccess ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto animate-bounce">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h5 className="font-bold text-slate-800 text-sm">Transaction Authorized</h5>
                  <p className="text-xs text-slate-500">Transaction code: TXN-{Date.now().toString().slice(-6)}</p>
                </div>
              ) : (
                <form onSubmit={handleProcessPayment} className="space-y-3">
                  {payError && (
                    <div className="p-2.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{payError}</span>
                    </div>
                  )}

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Settling Ledger for</span>
                    <span className="text-xs font-bold text-slate-700">{selectedInvoice.patientName}</span>
                    <span className="block text-xs font-extrabold text-indigo-600 mt-1">
                      Max Balance Due: ${(selectedInvoice.patientResponsibility - selectedInvoice.amountPaid).toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="James Cole"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Card Number</label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Expiry Date</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">CVV</label>
                      <input
                        type="password"
                        required
                        maxLength={3}
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Payment Amount ($)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                  >
                    Authorize Payment
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Setup Installment Payment Plan Dialog */}
      <AnimatePresence>
        {isSettingPlan && selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full p-5 space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-slate-800">Setup Interest-Free Plan</h4>
                </div>
                <button onClick={() => setIsSettingPlan(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleSetupPlanSubmit} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1">
                  <div>Remaining Patient Balance: <strong className="text-slate-800">${(selectedInvoice.patientResponsibility - selectedInvoice.amountPaid).toFixed(2)}</strong></div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Select Plan Duration</label>
                  <select
                    value={planMonths}
                    onChange={(e) => setPlanMonths(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50"
                  >
                    <option value="3">3 Months (0% APR) - ${((selectedInvoice.patientResponsibility - selectedInvoice.amountPaid) / 3).toFixed(2)}/mo</option>
                    <option value="6">6 Months (0% APR) - ${((selectedInvoice.patientResponsibility - selectedInvoice.amountPaid) / 6).toFixed(2)}/mo</option>
                    <option value="12">12 Months (0% APR) - ${((selectedInvoice.patientResponsibility - selectedInvoice.amountPaid) / 12).toFixed(2)}/mo</option>
                  </select>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] rounded-lg leading-relaxed">
                  <strong>Notice:</strong> This plan converts your medical balance to interest-free structured monthly installments. No credit checks required, compliance under HSA/FSA limits.
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Create Payment Plan
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Claim Dialog */}
      <AnimatePresence>
        {isFilingClaim && selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full p-5 space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-slate-800">File Insurance Claim</h4>
                </div>
                <button onClick={() => setIsFilingClaim(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleFileClaimSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Insurance Provider</label>
                  <input
                    type="text"
                    required
                    value={claimProvider}
                    onChange={(e) => setClaimProvider(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Policy ID / Number</label>
                  <input
                    type="text"
                    required
                    value={policyNum}
                    onChange={(e) => setPolicyNum(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50"
                  />
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] rounded-lg leading-relaxed">
                  Claim request will automatically extract itemized charges and match clinical ICD-10 medical codes for Dr. Jenkins' consult. Output will be pending approval.
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  File & Transmit Claim
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate Custom Invoice Dialog */}
      <AnimatePresence>
        {isCreatingInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-slate-800">Generate Itemized Ledger</h4>
                </div>
                <button onClick={() => setIsCreatingInvoice(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Patient Name</label>
                    <input
                      type="text"
                      required
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Patient ID</label>
                    <input
                      type="text"
                      required
                      value={newPatientId}
                      onChange={(e) => setNewPatientId(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 space-y-2">
                  <span className="block text-[11px] font-bold text-slate-500 uppercase">Add Itemized Charges</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., Specialized Cardiac Echo"
                      value={itemDesc}
                      onChange={(e) => setItemDesc(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddItemToInvoice}
                      className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-lg text-xs"
                    >
                      Add
                    </button>
                  </div>

                  {/* Added Items List */}
                  <div className="space-y-1.5 max-h-[100px] overflow-y-auto bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {createdItems.length === 0 ? (
                      <span className="text-[10px] text-slate-400 italic block text-center">No itemized charges added yet</span>
                    ) : (
                      createdItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                          <span>{item.description}</span>
                          <div className="flex items-center gap-2">
                            <span>${item.amount.toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItemFromInvoice(idx)}
                              className="text-red-500 hover:text-red-700 font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Insurance Copay (%)</label>
                    <select
                      value={insuranceCoverPercent}
                      onChange={(e) => setInsuranceCoverPercent(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50"
                    >
                      <option value="0">0% (Self Pay)</option>
                      <option value="50">50% (Standard PPO)</option>
                      <option value="80">80% (Premium HMO)</option>
                      <option value="100">100% (Full Covered)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Insurance Provider</label>
                    <input
                      type="text"
                      value={insuranceProviderInput}
                      onChange={(e) => setInsuranceProviderInput(e.target.value)}
                      placeholder="e.g., Blue Cross"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createdItems.length === 0}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer disabled:opacity-50"
                >
                  Generate Statement
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Printable Invoice Container */}
      <div id="printable-invoice-container" className="hidden print:block font-sans">
        {printInvoice && (
          <div className="max-w-3xl mx-auto p-6 bg-white border border-slate-200 rounded-xl space-y-6 text-black">
            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    🏥
                  </div>
                  <span className="text-lg font-extrabold text-slate-900 tracking-tight">City General Hospital</span>
                </div>
                <p className="text-xs text-slate-500">100 Medical Plaza, Health Sciences Campus</p>
                <p className="text-xs text-slate-500">Phone: (555) 019-2834 | Email: billing@citygeneral.org</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-wide">Official Medical Invoice</h2>
                <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                  <div><span className="font-semibold text-slate-700">Invoice ID:</span> {printInvoice.id}</div>
                  <div><span className="font-semibold text-slate-700">Issue Date:</span> {printInvoice.date}</div>
                  <div>
                    <span className="font-semibold text-slate-700">Status:</span>{' '}
                    <span className="font-bold uppercase text-indigo-600">{printInvoice.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient & Provider Details */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Patient Information</h3>
                <div className="text-xs text-slate-800 space-y-0.5">
                  <div className="font-bold text-sm text-slate-900">{printInvoice.patientName}</div>
                  <div><span className="text-slate-500">Patient ID:</span> {printInvoice.patientId}</div>
                  <div><span className="text-slate-500">Billing Account:</span> ACT-{printInvoice.patientId.slice(-5)}</div>
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Insurance & Coverage</h3>
                <div className="text-xs text-slate-800 space-y-0.5">
                  {printInvoice.insuranceProvider ? (
                    <>
                      <div className="font-bold text-slate-900">{printInvoice.insuranceProvider}</div>
                      <div><span className="text-slate-500">Claim Status:</span> <span className="font-semibold uppercase text-slate-700">{printInvoice.insuranceClaimStatus}</span></div>
                      <div><span className="text-slate-500">Coverage Portion:</span> ${(printInvoice.insuranceCoverage).toFixed(2)}</div>
                    </>
                  ) : (
                    <div className="text-slate-500 italic font-medium">No insurance coverage (Private Self-Pay)</div>
                  )}
                  {printInvoice.paymentPlan && (
                    <div className="mt-1.5 text-[10px] bg-indigo-50 border border-indigo-100/50 text-indigo-800 p-1 px-1.5 rounded font-medium">
                      💳 Active Interest-Free Payment Plan ({printInvoice.paymentPlan.totalMonths} months)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Itemized Services Table */}
            <div>
              <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Itemized Medical Statement</h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <th className="p-3">Service / Procedure Description</th>
                      <th className="p-3 text-right w-32">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {printInvoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3 font-medium">{item.description}</td>
                        <td className="p-3 text-right font-semibold text-slate-900">${item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations & Totals */}
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <div className="w-80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Services Total:</span>
                  <span className="font-semibold text-slate-800">${printInvoice.totalAmount.toFixed(2)}</span>
                </div>
                {printInvoice.insuranceCoverage > 0 && (
                  <div className="flex justify-between text-indigo-600 font-medium">
                    <span>Insurance Paid (Coverage):</span>
                    <span>-${printInvoice.insuranceCoverage.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1.5 text-sm">
                  <span>Patient Responsibility:</span>
                  <span>${printInvoice.patientResponsibility.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Payments Credited:</span>
                  <span>-${printInvoice.amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-slate-900 border-t-2 border-double border-slate-200 pt-2 text-base bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-700">Outstanding Balance:</span>
                  <span className="text-indigo-600">${(printInvoice.patientResponsibility - printInvoice.amountPaid).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="pt-12 text-center text-[10px] text-slate-400 space-y-1">
              <p>Thank you for choosing City General Hospital. We are dedicated to providing you with the highest standard of care.</p>
              <p>For billing disputes, installment modifications, or payment questions, please contact our accounts department.</p>
              <p className="font-semibold text-slate-500 mt-2">© 2026 City General Hospital Corporation. All rights reserved.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
