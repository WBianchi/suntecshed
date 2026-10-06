"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { FiShield, FiLock, FiDatabase, FiUserCheck, FiGlobe, FiMail, FiAlertCircle } from "react-icons/fi";

const sections = [
  {
    id: "coleta",
    icon: FiDatabase,
    title: "1. Coleta de Dados",
    content: `
      <p>A Suntecshed coleta informações pessoais quando você:</p>
      <ul>
        <li>Cria uma conta em nosso site</li>
        <li>Realiza uma compra ou solicitação de orçamento</li>
        <li>Se inscreve em nossa newsletter</li>
        <li>Entra em contato conosco por qualquer canal</li>
        <li>Navega em nosso site (cookies e dados de navegação)</li>
      </ul>
      <p>Os dados coletados podem incluir: nome completo, e-mail, telefone, CPF/CNPJ, endereço de entrega, dados de pagamento e informações de navegação.</p>
    `,
  },
  {
    id: "uso",
    icon: FiUserCheck,
    title: "2. Uso das Informações",
    content: `
      <p>Utilizamos seus dados pessoais para:</p>
      <ul>
        <li>Processar e entregar seus pedidos</li>
        <li>Personalizar sua experiência de compra</li>
        <li>Enviar atualizações sobre pedidos e promoções (com seu consentimento)</li>
        <li>Melhorar nossos produtos e serviços</li>
        <li>Prevenir fraudes e garantir a segurança da plataforma</li>
        <li>Cumprir obrigações legais e regulatórias</li>
      </ul>
    `,
  },
  {
    id: "protecao",
    icon: FiLock,
    title: "3. Proteção dos Dados",
    content: `
      <p>Adotamos medidas técnicas e organizacionais para proteger seus dados pessoais:</p>
      <ul>
        <li>Criptografia SSL/TLS em todas as transmissões de dados</li>
        <li>Armazenamento seguro com acesso restrito</li>
        <li>Monitoramento contínuo contra ameaças</li>
        <li>Treinamento regular da equipe sobre proteção de dados</li>
        <li>Backup periódico com recuperação de desastres</li>
      </ul>
      <p>Seus dados de pagamento são processados diretamente por gateways de pagamento certificados PCI-DSS, sem armazenamento em nossos servidores.</p>
    `,
  },
  {
    id: "compartilhamento",
    icon: FiGlobe,
    title: "4. Compartilhamento",
    content: `
      <p>Seus dados podem ser compartilhados com:</p>
      <ul>
        <li><strong>Transportadoras:</strong> para entrega dos seus pedidos</li>
        <li><strong>Gateways de pagamento:</strong> para processamento de transações</li>
        <li><strong>Ferramentas de marketing:</strong> para envio de comunicações (com seu consentimento)</li>
        <li><strong>Autoridades legais:</strong> quando exigido por lei ou ordem judicial</li>
      </ul>
      <p>Nunca vendemos seus dados pessoais a terceiros.</p>
    `,
  },
  {
    id: "cookies",
    icon: FiShield,
    title: "5. Cookies",
    content: `
      <p>Utilizamos cookies e tecnologias semelhantes para:</p>
      <ul>
        <li>Manter sua sessão ativa e preferências salvas</li>
        <li>Analisar tráfego e comportamento de navegação</li>
        <li>Personalizar conteúdo e anúncios</li>
        <li>Melhorar a performance do site</li>
      </ul>
      <p>Você pode gerenciar as configurações de cookies nas preferências do seu navegador. Desabilitar cookies pode afetar funcionalidades do site.</p>
    `,
  },
  {
    id: "direitos",
    icon: FiUserCheck,
    title: "6. Seus Direitos (LGPD)",
    content: `
      <p>De acordo com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018), você tem direito a:</p>
      <ul>
        <li>Confirmar a existência de tratamento de seus dados</li>
        <li>Acessar seus dados pessoais</li>
        <li>Corrigir dados incompletos ou desatualizados</li>
        <li>Solicitar a anonimização, bloqueio ou eliminação de dados</li>
        <li>Solicitar a portabilidade dos dados</li>
        <li>Revogar o consentimento a qualquer momento</li>
        <li>Obter informações sobre entidades com quem compartilhamos dados</li>
      </ul>
      <p>Para exercer seus direitos, entre em contato pelo e-mail <strong>privacidade@Suntecshed.com.br</strong>.</p>
    `,
  },
  {
    id: "contato",
    icon: FiMail,
    title: "7. Contato do Encarregado (DPO)",
    content: `
      <p>Para questões relacionadas à proteção de dados pessoais:</p>
      <p><strong>Encarregado de Proteção de Dados (DPO)</strong><br/>
      E-mail: privacidade@Suntecshed.com.br<br/>
      Telefone: (38) 9884-2080<br/>
      Endereço: Endereço virtual</p>
      <p>Respondemos às solicitações em até 15 dias úteis.</p>
    `,
  },
];

export default function PoliticaPrivacidadePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
          <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-6 sm:pb-16 sm:pt-8">
            <Breadcrumb items={[{ label: "Política de Privacidade" }]} />
            <div className="mt-6 flex items-center gap-4 sm:mt-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <FiShield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-4xl" style={{ fontFamily: "var(--font-playfair)" }}>
                  Política de Privacidade
                </h1>
                <p className="mt-1 text-sm text-white/50">Última atualização: Março de 2025</p>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8 sm:py-12">
          <div className="mx-auto max-w-[1440px] px-4">
            <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
              {/* Sidebar Nav */}
              <aside className="hidden lg:block">
                <nav className="sticky top-24 space-y-1">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Navegação</p>
                  {sections.map((s) => (
                    <a key={s.id} href={`#${s.id}`}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-600 transition-all hover:bg-primary/5 hover:text-primary">
                      <s.icon className="h-3.5 w-3.5" /> {s.title}
                    </a>
                  ))}
                </nav>
              </aside>

              {/* Main content */}
              <div className="space-y-8">
                {/* Intro */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
                  <div className="flex gap-3">
                    <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    <div className="text-sm text-primary">
                      <p className="font-semibold">Compromisso com sua privacidade</p>
                      <p className="mt-1 text-xs leading-relaxed text-blue-600">
                        A Suntecshed LTDA (CNPJ: 23.838.704/0001-33) está comprometida com a proteção dos seus dados pessoais,
                        em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
                      </p>
                    </div>
                  </div>
                </div>

                {sections.map((s) => (
                  <div key={s.id} id={s.id} className="scroll-mt-24 rounded-2xl border border-gray-100 bg-white p-6 sm:p-8">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <s.icon className="h-5 w-5" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>{s.title}</h2>
                    </div>
                    <div
                      className="prose prose-sm max-w-none prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-li:text-sm prose-strong:text-gray-800 prose-ul:space-y-1"
                      dangerouslySetInnerHTML={{ __html: s.content }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
      <ChatWidget />
      <MobileBottomNav />
    </div>
  );
}
