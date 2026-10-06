"use client";

import { useState, useEffect, useRef } from "react";
import { getRecaptchaToken } from "@/lib/recaptcha-client";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { CheckoutPersonalData, type PersonalData } from "@/components/checkout/CheckoutPersonalData";
import { CheckoutAddress, type AddressData } from "@/components/checkout/CheckoutAddress";
import { CheckoutPayment, type PaymentData } from "@/components/checkout/CheckoutPayment";
import { CheckoutConfirmation, type PaymentResult } from "@/components/checkout/CheckoutConfirmation";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { AuthModal } from "@/components/checkout/AuthModal";
import { useCart } from "@/providers/cart-provider";
import { useAuth } from "@/providers/auth-provider";
import { FiShoppingBag, FiArrowLeft, FiLock, FiLoader } from "react-icons/fi";

export default function CheckoutPage() {
  const { items, subtotal, itemCount, clearCart, shipping } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [orderNumber, setOrderNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [paymentWarning, setPaymentWarning] = useState<string | null>(null);
  // Congela o total no momento da confirmação — clearCart() zera o carrinho
  // logo em seguida, e a tela de confirmação (step 4) não pode recalcular
  // o total a partir de um carrinho já vazio.
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const prefilled = useRef(false);

  const [personal, setPersonal] = useState<PersonalData>({
    name: "",
    lastName: "",
    email: "",
    phone: "",
    personType: "fisica",
    cpf: "",
    cnpj: "",
    labelUrl: "",
    labelName: "",
  });

  const [address, setAddress] = useState<AddressData>({
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    recipientName: "",
    recipientDocument: "",
    observations: "",
  });

  const [payment, setPayment] = useState<PaymentData>({
    method: "pix",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: "",
    installments: 1,
    useWalletBalance: false,
    billingCep: "",
    billingStreet: "",
    billingNumber: "",
    billingNeighborhood: "",
    billingCity: "",
    billingState: "",
  });

  // Prefill personal data and address for logged-in users
  useEffect(() => {
    if (!user || prefilled.current) return;
    prefilled.current = true;

    (async () => {
      try {
        const res = await fetch("/api/auth/profile", { credentials: "include" });
        if (!res.ok) return;
        const { user: profile, defaultAddress } = await res.json();
        const [firstName, ...restName] = String(profile?.name || "").split(" ");

        setPersonal((prev) => ({
          ...prev,
          name: prev.name || firstName || "",
          lastName: prev.lastName || restName.join(" ") || "",
          email: prev.email || profile?.email || "",
          phone: prev.phone || profile?.phone || defaultAddress?.phone || "",
          personType: prev.personType || (profile?.cnpj ? "juridica" : "fisica"),
          cpf: prev.cpf || profile?.cpf || "",
          cnpj: prev.cnpj || profile?.cnpj || "",
        }));

        const formatCep = (v: string) => {
          const d = (v || "").replace(/\D/g, "").slice(0, 8);
          return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
        };
        const src = profile?.street ? profile : defaultAddress;
        if (src) {
          setAddress((prev) => ({
            ...prev,
            cep: prev.cep || formatCep(src.zipCode),
            street: prev.street || src.street || "",
            number: prev.number || src.number || "",
            complement: prev.complement || src.complement || "",
            neighborhood: prev.neighborhood || src.neighborhood || "",
            city: prev.city || src.city || "",
            state: prev.state || src.state || "",
            recipientName: prev.recipientName || profile?.name || "",
            recipientDocument: prev.recipientDocument || profile?.cpf || profile?.cnpj || "",
          }));
        }
      } catch {
        // Prefill is best-effort; user can type manually
      }
    })();
  }, [user]);

  // Quem anexa a própria etiqueta já tem o endereço de entrega nela — pula
  // a etapa de endereço (step 2). Isso não zera o frete/embalagem: o valor
  // já escolhido no carrinho (ex: taxa de embalagem) continua sendo cobrado.
  const hasLabel = !!personal.labelUrl;

  // The real shipping option is picked inside CheckoutAddress (step 2), which
  // pre-fills the choice made on /carrinho or lets the user pick right there.
  const shippingCost = shipping?.price ?? 0;
  const total = subtotal + shippingCost;

  const handleConfirmOrder = async () => {
    setSubmitting(true);
    setOrderError("");
    try {
      const recaptchaToken = await getRecaptchaToken("checkout");
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          recaptchaToken,
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
            color: i.color,
            size: i.size,
            tier: i.tier,
          })),
          personal,
          address,
          payment: {
            method: payment.method,
            installments: payment.installments,
            useWalletBalance: payment.useWalletBalance,
            ...(payment.method === "card" && {
              card: {
                number: payment.cardNumber,
                name: payment.cardName,
                expiry: payment.cardExpiry,
                cvv: payment.cardCvv,
              },
            }),
            // Endereço de cobrança separado — usado quando o cliente anexou
            // etiqueta própria e não tem endereço de entrega preenchido.
            billingAddress: hasLabel
              ? {
                  cep: payment.billingCep,
                  street: payment.billingStreet,
                  number: payment.billingNumber,
                  neighborhood: payment.billingNeighborhood,
                  city: payment.billingCity,
                  state: payment.billingState,
                }
              : undefined,
          },
          subtotal,
          shipping: shippingCost,
          shippingOption: shipping,
          discount: 0,
          total,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setAuthModalOpen(true);
          return;
        }
        setOrderError(data.error || "Error creating order. Please try again.");
        return;
      }
      setOrderNumber(data.orderNumber);
      setPaymentResult(data.payment || null);
      setPaymentWarning(data.paymentWarning || null);
      setConfirmedTotal(total);
      clearCart();
      setStep(4);
    } catch {
      setOrderError("Connection error. Check your internet and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && step < 4) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <FiShoppingBag className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
            Empty cart
          </h2>
          <p className="mt-2 max-w-sm text-center text-sm text-gray-500">
            Add products to your cart before proceeding to checkout.
          </p>
          <Link
            href="/produtos"
            className="mt-6 flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark"
          >
            Browse Products
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="neo-bg flex-1 pb-20 md:pb-0">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-[1440px] px-4 py-4">
          <Breadcrumb
            items={[
              { label: "Cart", href: "/carrinho" },
              { label: "Checkout" },
            ]}
          />
        </div>

        <div className="mx-auto max-w-[1440px] px-4 pb-12">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="neo-surface-sm flex h-12 w-12 items-center justify-center text-primary">
              <FiLock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                Secure Checkout
              </h1>
              <p className="text-sm text-gray-500">{itemCount} {itemCount === 1 ? "item" : "items"} in the order</p>
            </div>
          </div>

          {/* Steps */}
          <div className="neo-surface-sm mb-8 p-3 sm:p-5">
            <CheckoutSteps currentStep={step} />
          </div>

          {/* Content */}
          {step === 4 ? (
            <CheckoutConfirmation
              personal={personal}
              address={address}
              payment={payment}
              total={confirmedTotal}
              orderNumber={orderNumber}
              paymentResult={paymentResult}
              paymentWarning={paymentWarning}
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              {/* Left — Form */}
              <div className="min-w-0">
                {step === 1 && (
                  <CheckoutPersonalData
                    data={personal}
                    onChange={setPersonal}
                    onNext={() => setStep(hasLabel ? 3 : 2)}
                  />
                )}
                {step === 2 && !hasLabel && (
                  <CheckoutAddress
                    data={address}
                    onChange={setAddress}
                    onNext={() => setStep(3)}
                    onBack={() => setStep(1)}
                  />
                )}
                {step === 3 && (
                  <CheckoutPayment
                    data={payment}
                    onChange={setPayment}
                    onNext={handleConfirmOrder}
                    onBack={() => setStep(hasLabel ? 1 : 2)}
                    total={total}
                    submitting={submitting}
                    showBillingAddress={hasLabel}
                  />
                )}
                {orderError && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {orderError}
                  </div>
                )}

                {/* Back */}
                {step === 1 && (
                  <div className="mt-4">
                    <Link
                      href="/carrinho"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <FiArrowLeft className="h-3.5 w-3.5" /> Voltar ao carrinho
                    </Link>
                  </div>
                )}
              </div>

              {/* Right — Order Summary */}
              <div className="min-w-0 lg:sticky lg:top-44 lg:self-start">
                <CheckoutOrderSummary
                  shippingCost={shippingCost}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <ChatWidget />
      <MobileBottomNav />
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          handleConfirmOrder();
        }}
      />
    </div>
  );
}
