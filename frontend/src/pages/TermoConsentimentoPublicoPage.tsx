import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Logo } from '../components/Logo';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Eraser,
  Check
} from 'lucide-react';

interface TermoConsentimentoPublicoPageProps {
  clienteId?: string;
}

export const TermoConsentimentoPublicoPage: React.FC<TermoConsentimentoPublicoPageProps> = ({ clienteId = 'cli-1' }) => {
  const [dadosTermo, setDadosTermo] = useState<any>(null);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [concordou, setConcordou] = useState<boolean>(false);
  const [assinadoSucesso, setAssinadoSucesso] = useState<boolean>(false);
  const [salvando, setSalvando] = useState<boolean>(false);

  // Canvas para assinatura touch/mouse
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [desenhando, setDesenhando] = useState<boolean>(false);
  const [temAssinatura, setTemAssinatura] = useState<boolean>(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        setCarregando(true);
        const res = await api.getTermoPublico(clienteId);
        setDadosTermo(res);
        if (res.status_consentimento === 'assinado') {
          setAssinadoSucesso(true);
        }
      } catch (err) {
        console.error('Erro ao carregar termo público:', err);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, [clienteId]);

  // Inicializa o canvas de desenho
  useEffect(() => {
    if (!canvasRef.current || assinadoSucesso) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#4A3F35';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [assinadoSucesso, carregando]);

  const iniciarDesenho = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setDesenhando(true);
    setTemAssinatura(true);
    desenhar(e);
  };

  const pararDesenho = () => {
    setDesenhando(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const desenhar = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!desenhando || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const limparCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTemAssinatura(false);
  };

  const handleConfirmarAssinatura = async () => {
    if (!concordou) {
      alert('Por favor, marque a caixa confirmando a leitura e concordância com os termos.');
      return;
    }

    if (!temAssinatura && !canvasRef.current) {
      alert('Por favor, assine digitalmente no campo indicado abaixo.');
      return;
    }

    try {
      setSalvando(true);
      const canvas = canvasRef.current;
      const assinaturaBase64 = canvas ? canvas.toDataURL('image/png') : 'assinatura_digital_confirmada';

      await api.assinarTermoPublico(clienteId, assinaturaBase64);
      setAssinadoSucesso(true);
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar assinatura.');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 text-[#7A6C60]">
        <Logo size="md" />
        <p className="text-xs font-semibold mt-4">Carregando Termo de Consentimento LGPD...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#4A3F35] py-10 px-4 sm:px-6 relative selection:bg-[#E8DFD5]">
      {/* Marca d'água de fundo */}
      <Logo watermark={true} className="fixed inset-0 m-auto pointer-events-none" />

      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-[#E8DFD5] relative z-10 space-y-6">
        {/* Cabeçalho Oficial */}
        <div className="text-center pb-6 border-b border-[#F2ECE4]">
          <div className="flex justify-center mb-3">
            <Logo size="md" showText={true} />
          </div>
          <h1
            className="text-xl sm:text-2xl font-bold text-[#2D241E] font-serif tracking-tight mt-2"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Termo de Consentimento Livre e Esclarecido
          </h1>
          <p className="text-xs text-[#7A6C60] mt-1">
            Tratamento de Dados Pessoais de Saúde e Uso de Imagens (Lei Geral de Proteção de Dados — LGPD)
          </p>
        </div>

        {/* Identificação da Titular */}
        <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#E8DFD5] text-xs space-y-1">
          <p>
            <strong className="text-[#2D241E]">Titular dos Dados:</strong> {dadosTermo?.nome || 'Cliente'}
          </p>
          <p>
            <strong className="text-[#2D241E]">Telefone / Contato:</strong> {dadosTermo?.telefone || '(11) 98765-4321'}
          </p>
          <p>
            <strong className="text-[#2D241E]">Controladora:</strong> MC Estética & Bem-Estar — Dra. Márcia Cristina
          </p>
        </div>

        {/* Texto Jurídico do Termo */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FCFAF7] border border-[#E8DFD5] text-xs text-[#5C4D40] leading-relaxed space-y-3.5 max-h-[300px] overflow-y-auto">
          <p>
            <strong>1. FINALIDADE DO TRATAMENTO:</strong> O titular consente, expressamente, que a clínica <strong>MC Estética & Bem-Estar</strong> colete, armazene e processe seus dados pessoais e dados sensíveis de saúde (formulário de anamnese, histórico de alergias, procedimentos anteriores e contraindicações) com a finalidade exclusiva de prestar atendimento estético seguro, individualizado e em conformidade com as normas biomédicas e sanitárias.
          </p>

          <p>
            <strong>2. REGISTRO FOTOGRÁFICO EVOLUTIVO:</strong> Fica autorizado o registro de fotografias antes e após as sessões de procedimentos estéticos, com o objetivo de acompanhamento clínico da resposta tecidual e evolução dos tratamentos. As imagens serão armazenadas de forma segura em ambiente de nuvem da clínica (Google Drive Institucional) e não serão divulgadas publicamente sem consentimento prévio e por escrito.
          </p>

          <p>
            <strong>3. PRAZO DE RETENÇÃO E SEGURANÇA:</strong> Os dados clínicos e anamneses serão retidos pelo período regulamentar de até 5 (cinco) anos após o último atendimento, prazo após o qual passarão por processo de anonimização, garantindo sigilo profissional e proteção contra acessos não autorizados.
          </p>

          <p>
            <strong>4. DIREITOS DA TITULAR (ART. 18 DA LGPD):</strong> É garantido ao titular, a qualquer momento e mediante simples requisição à equipe da clínica, o direito de confirmar a existência de tratamento, solicitar o acesso/exportação completa de seus dados e requerer a revogação deste consentimento ou exclusão de seu prontuário clínico.
          </p>
        </div>

        {/* Bloco de Assinatura ou Confirmação */}
        {assinadoSucesso ? (
          <div className="p-6 bg-[#F2F8F3] border border-[#C8E4CD] rounded-2xl text-center space-y-3 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-[#EBF5EC] text-[#3D7342] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#2E5E35] font-serif">
              Termo de Consentimento Assinado com Sucesso!
            </h3>
            <p className="text-xs text-[#3D7342] max-w-md mx-auto leading-relaxed">
              O seu consentimento digital foi registrado e anexado ao seu prontuário na clínica MC Estética & Bem-Estar.
            </p>
            <div className="pt-2 text-[11px] text-[#5A875F] flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Assinatura Digital Autenticada e Protegida sob a LGPD</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Checkbox de Concordância */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DFD5] cursor-pointer hover:bg-[#F2ECE4] transition-colors">
              <input
                type="checkbox"
                checked={concordou}
                onChange={e => setConcordou(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#C4A883] focus:ring-[#C4A883] cursor-pointer"
              />
              <span className="text-xs text-[#3D332A] leading-relaxed">
                Declaro que li e compreendi integralmente os termos acima expostos, autorizando o tratamento de meus dados de saúde e acompanhamento fotográfico pela Dra. Márcia Cristina.
              </span>
            </label>

            {/* Campo Canvas para Assinatura Touch/Mouse */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#3D332A]">
                  Assine no quadro abaixo (touch no celular ou mouse):
                </label>
                {temAssinatura && (
                  <button
                    type="button"
                    onClick={limparCanvas}
                    className="flex items-center gap-1 text-[11px] text-[#C25953] hover:underline cursor-pointer"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Limpar Assinatura</span>
                  </button>
                )}
              </div>

              <div className="border-2 border-dashed border-[#C4A883]/60 rounded-2xl bg-white p-2 relative overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={150}
                  onMouseDown={iniciarDesenho}
                  onMouseUp={pararDesenho}
                  onMouseMove={desenhar}
                  onMouseLeave={pararDesenho}
                  onTouchStart={iniciarDesenho}
                  onTouchEnd={pararDesenho}
                  onTouchMove={desenhar}
                  className="w-full h-32 bg-transparent cursor-crosshair touch-none"
                />
                {!temAssinatura && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-[#AFA499] italic">
                    Desenhe sua assinatura aqui
                  </div>
                )}
              </div>
            </div>

            {/* Botão de Envio */}
            <button
              onClick={handleConfirmarAssinatura}
              disabled={salvando || !concordou}
              className="w-full py-3.5 bg-[#C4A883] hover:bg-[#B39670] text-white rounded-2xl font-semibold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{salvando ? 'Processando Assinatura...' : 'Confirmar e Assinar Digitalmente'}</span>
            </button>
          </div>
        )}

        {/* Rodapé Institucional */}
        <footer className="pt-4 border-t border-[#F2ECE4] text-center text-[11px] text-[#8C7D70] space-y-1">
          <p>© {new Date().getFullYear()} MC Estética & Bem-Estar — Dra. Márcia Cristina</p>
          <div className="flex items-center justify-center gap-3">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#A68A64]" />
              Conexão Segura SSL/TLS
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#3D7342]" />
              LGPD Compliance
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
