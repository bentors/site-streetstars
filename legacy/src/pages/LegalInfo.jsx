import { useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import SEO from '../components/SEO'

const LEGAL_CONTENT = {
  'termos-de-uso': {
    title: 'Termos de Uso',
    description: 'Termos e condições de uso do site Street Stars.',
    content: `Última atualização: Janeiro de 2026

Bem-vindo à Street Stars. Ao acessar e usar nosso site, você concorda com estes Termos de Uso. Leia atentamente antes de realizar qualquer compra.

1. ACEITAÇÃO DOS TERMOS
Ao acessar o site streetstars.vercel.app, você concorda em cumprir estes Termos de Uso e todas as leis aplicáveis. Se você não concorda com algum destes termos, não utilize nosso site.

2. CADASTRO E CONTA DE USUÁRIO
2.1 Obrigatoriedade
Para realizar compras, é obrigatória a criação de uma conta de usuário.

2.2 Responsabilidades
Você é responsável por:
• Fornecer informações verdadeiras, atualizadas e completas
• Manter a confidencialidade de sua senha
• Todas as atividades realizadas em sua conta
• Notificar imediatamente sobre uso não autorizado

2.3 Idade Mínima
Nossos produtos são destinados a maiores de 18 anos. Menores de idade podem realizar compras somente com autorização e supervisão de pais ou responsáveis legais.

3. PRODUTOS E PREÇOS
3.1 Disponibilidade
Todos os produtos estão sujeitos a disponibilidade. Trabalhamos com drops e edições limitadas, que podem esgotar rapidamente.

3.2 Descrições
Fazemos o possível para descrever e exibir nossos produtos com precisão. No entanto, cores podem variar devido a configurações de tela.

3.3 Preços
• Todos os preços estão em Reais (R$) e podem ser alterados sem aviso prévio
• Preços promocionais são válidos enquanto durarem os estoques ou até a data especificada
• Em caso de erro evidente no preço, reservamo-nos o direito de cancelar o pedido

4. PEDIDOS E PAGAMENTO
4.1 Processamento
Processamos pagamentos através do Mercado Pago. Ao finalizar a compra, você será redirecionado para a plataforma segura de pagamento.

4.2 Confirmação
Você receberá um e-mail de confirmação após a aprovação do pagamento. A confirmação não garante a disponibilidade do produto em caso de estoques limitados.

4.3 Cancelamento
Reservamo-nos o direito de recusar ou cancelar qualquer pedido por:
• Fraude ou tentativa de fraude
• Indisponibilidade do produto
• Erro no preço ou descrição
• Problemas identificados pelo sistema de prevenção de fraudes

5. ENTREGA
Os prazos e condições de entrega serão informados durante o processo de checkout e podem variar conforme a região de entrega.

6. PROPRIEDADE INTELECTUAL
6.1 Direitos Autorais
Todo o conteúdo do site (textos, imagens, logos, designs, vídeos) é de propriedade exclusiva da Street Stars e está protegido por leis de direitos autorais.

6.2 Uso Proibido
É expressamente proibido:
• Copiar, reproduzir ou distribuir qualquer conteúdo do site sem autorização prévia
• Usar nossas imagens, logos ou designs para fins comerciais não autorizados
• Criar obras derivadas baseadas em nosso conteúdo
• Fazer engenharia reversa de qualquer parte do site

6.3 Revenda
A revenda de produtos físicos adquiridos legitimamente é permitida. No entanto, o uso de nossas imagens, descrições ou marca para comercialização não autorizada é proibido.

7. USO DO SITE
7.1 Conduta Proibida
Você concorda em NÃO:
• Usar o site para fins ilegais
• Tentar acessar áreas restritas do sistema
• Interferir no funcionamento do site
• Enviar vírus, malware ou códigos maliciosos
• Fazer uso abusivo do sistema (spam, scraping, etc)
• Realizar compras usando informações falsas ou de terceiros sem autorização

7.2 Consequências
Violações destes termos podem resultar em:
• Suspensão ou encerramento da conta
• Cancelamento de pedidos
• Medidas legais cabíveis

8. LIMITAÇÃO DE RESPONSABILIDADE
A Street Stars não se responsabiliza por:
• Danos indiretos, incidentais ou consequenciais
• Perda de lucros ou dados
• Interrupções temporárias no site
• Atrasos de entrega causados por transportadoras
• Uso indevido dos produtos adquiridos

9. LINKS DE TERCEIROS
Nosso site pode conter links para sites de terceiros (Mercado Pago, redes sociais, etc). Não somos responsáveis pelo conteúdo ou práticas de privacidade desses sites.

10. MODIFICAÇÕES
Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Alterações significativas serão comunicadas por e-mail ou aviso no site. O uso continuado do site após as alterações constitui aceitação dos novos termos.

11. LEI APLICÁVEL
Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será resolvida no foro da comarca de São Paulo - SP.

12. CÓDIGO DE DEFESA DO CONSUMIDOR
Nada nestes Termos de Uso limita ou exclui direitos garantidos pelo Código de Defesa do Consumidor (Lei 8.078/90).

13. CONTATO
Para dúvidas, sugestões ou reclamações:
E-mail: streetstars.company@gmail.com
WhatsApp: https://wa.me/5511999999999
Instagram: @_streetstars.co

Street Stars — São Paulo - SP
CNPJ: [Em registro]

Ao utilizar nosso site, você declara ter lido, compreendido e concordado com estes Termos de Uso.`
  },

  'politica-de-privacidade': {
    title: 'Política de Privacidade',
    description: 'Como a Street Stars coleta, usa e protege seus dados pessoais.',
    content: `Última atualização: Janeiro de 2026

A Street Stars respeita a sua privacidade e está comprometida em proteger seus dados pessoais. Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas informações.

1. INFORMAÇÕES QUE COLETAMOS
1.1 Dados Fornecidos por Você
Ao criar uma conta ou realizar uma compra, coletamos:
• Nome completo
• E-mail
• Telefone
• Endereço completo (para entrega)
• Dados de pagamento (processados pelo Mercado Pago)

1.2 Dados Coletados Automaticamente
Utilizamos cookies e tecnologias similares para coletar:
• Endereço IP
• Tipo de navegador
• Páginas visitadas
• Tempo de permanência no site
• Origem do acesso
Utilizamos o Google Analytics para análise de tráfego e comportamento dos usuários.

2. COMO USAMOS SEUS DADOS
Utilizamos suas informações para:
• Processar e enviar seus pedidos
• Gerenciar sua conta de cliente
• Enviar confirmações de pedido e atualizações de entrega
• Melhorar a experiência de navegação no site
• Prevenir fraudes e garantir a segurança
• Cumprir obrigações legais e fiscais
• Comunicar sobre novos produtos e coleções (mediante seu consentimento)

3. COMPARTILHAMENTO DE DADOS
Seus dados podem ser compartilhados com:
• Mercado Pago: Para processamento de pagamentos. O Mercado Pago possui sua própria política de privacidade.
• Transportadoras: Compartilhamos nome, endereço e telefone para viabilizar a entrega.
• Google Analytics: Para análise de dados de navegação de forma anônima e agregada.
• Autoridades competentes: Quando exigido por lei ou ordem judicial.
Importante: A Street Stars NUNCA vende seus dados pessoais para terceiros.

4. COOKIES
Utilizamos cookies essenciais para o funcionamento do site e cookies analíticos (Google Analytics) para melhorar sua experiência.
Você pode desabilitar cookies nas configurações do seu navegador, mas isso pode afetar algumas funcionalidades do site.

5. SEGURANÇA DOS DADOS
Adotamos medidas técnicas e organizacionais para proteger seus dados:
• Criptografia de dados sensíveis
• Acesso restrito às informações
• Servidores seguros
• Monitoramento constante
Apesar de todos os esforços, nenhum sistema é 100% seguro. Em caso de violação de dados, notificaremos você conforme exigido pela LGPD.

6. SEUS DIREITOS (LGPD)
De acordo com a Lei Geral de Proteção de Dados, você tem direito a:
• Confirmação e acesso: Saber se tratamos seus dados e acessá-los
• Correção: Corrigir dados incompletos ou desatualizados
• Anonimização ou exclusão: Solicitar que seus dados sejam anonimizados ou excluídos
• Portabilidade: Solicitar seus dados em formato estruturado
• Revogação do consentimento: Retirar seu consentimento a qualquer momento
Para exercer seus direitos, entre em contato: streetstarsco@gmail.com

7. RETENÇÃO DE DADOS
Mantemos seus dados pelo tempo necessário para:
• Cumprir as finalidades descritas nesta política
• Cumprir obrigações legais (como dados fiscais por 5 anos)
• Resolver disputas e fazer cumprir nossos acordos
Após esse período, seus dados serão excluídos ou anonimizados.

8. MENORES DE IDADE
Nosso site é destinado a maiores de 18 anos. Menores de idade podem realizar compras somente com autorização e supervisão de pais ou responsáveis legais.

9. ALTERAÇÕES NESTA POLÍTICA
Podemos atualizar esta Política de Privacidade periodicamente. Mudanças significativas serão comunicadas por e-mail ou aviso no site.

10. CONTATO
Para dúvidas sobre esta Política de Privacidade ou para exercer seus direitos:
E-mail: streetstars.company@gmail.com
WhatsApp: https://wa.me/5511999999999

Street Stars — São Paulo - SP
CNPJ: [Em registro]

Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018) e o Marco Civil da Internet (Lei 12.965/2014).`
  },

  'trocas-e-devolucoes': {
    title: 'Trocas e Devoluções',
    description: 'Política de trocas e devoluções da Street Stars.',
    content: `Última atualização: Janeiro de 2026

Na Street Stars, queremos que você fique satisfeito com sua compra. Esta política explica como funcionam trocas e devoluções.

1. DIREITO DE ARREPENDIMENTO (7 DIAS)
1.1 Prazo Legal
Conforme o Código de Defesa do Consumidor, você tem 7 dias corridos a partir do recebimento do produto para desistir da compra, sem necessidade de justificativa.

1.2 Condições
Para exercer o direito de arrependimento, o produto deve estar:
• Sem uso (não lavado, não vestido)
• Com todas as etiquetas originais intactas
• Na embalagem original (sempre que possível)
• Sem danos causados pelo manuseio inadequado

1.3 Como Solicitar
• Acesse nosso formulário de devolução (em breve) ou contate via WhatsApp
• Preencha com os dados do pedido e motivo da devolução
• Aguarde nossas instruções por e-mail (em até 48h úteis)
• Envie o produto conforme orientações recebidas

1.4 Frete
No caso de arrependimento, o frete de devolução é por conta do cliente.

1.5 Reembolso
Após aprovação da devolução, o reembolso será processado em até 7 dias úteis. O prazo para o valor aparecer em sua conta pode variar conforme a operadora do cartão ou banco.

2. TROCA POR TAMANHO
2.1 Prazo
Você pode solicitar troca por tamanho em até 30 dias após o recebimento.

2.2 Condições
A peça deve estar:
• Sem uso (não lavada, não vestida)
• Com todas as etiquetas originais
• Em perfeito estado

2.3 Disponibilidade
A troca está sujeita à disponibilidade do tamanho desejado em estoque. Se o tamanho não estiver disponível, oferecemos:
• Crédito na loja (mesmo valor do produto)
• Reembolso integral

2.4 Frete
No caso de troca por tamanho, o frete de envio e retorno é por conta do cliente.
Dica: Consulte nossa Guia de Medidas antes de comprar para evitar trocas.

3. PRODUTO COM DEFEITO
3.1 Prazo de Reclamação
• Defeito aparente: até 7 dias após o recebimento
• Defeito oculto: até 90 dias após o recebimento

3.2 O que é Considerado Defeito
• Costuras soltas ou desfeitas
• Bordado com falhas de fabricação
• Tecido rasgado ou com furos
• Manchas permanentes de fabricação
• Descoloração não causada por lavagem

3.3 O que NÃO é Defeito
• Desgaste natural pelo uso
• Danos causados por lavagem inadequada
• Encolhimento dentro da margem de 3-5% (conforme especificado)
• Arranhões ou danos causados pelo cliente
• Diferenças de tonalidade em relação às fotos (variação de tela)

3.4 Processo
• Entre em contato imediatamente pelo nosso WhatsApp ou E-mail
• Envie fotos claras do defeito
• Nossa equipe analisará o caso em até 48h úteis
• Se aprovado, você escolhe entre: Troca por produto idêntico (novo) ou Reembolso integral (valor do produto + frete original)

3.5 Frete
No caso de produto com defeito, o frete de devolução é por nossa conta. Enviaremos uma etiqueta de postagem ou código de autorização.

4. PRODUTOS EM PROMOÇÃO OU EDIÇÃO LIMITADA
Produtos adquiridos em promoção ou de drops/edições limitadas seguem as mesmas regras de troca e devolução, exceto quando expressamente indicado na página do produto.

5. PROCESSO DE TROCA/DEVOLUÇÃO
Passo 1: Solicitação
Preencha o formulário online ou contate via WhatsApp com:
• Número do pedido
• E-mail cadastrado
• Motivo da troca/devolução
• Fotos do produto (se aplicável)

Passo 2: Aprovação
Analisaremos sua solicitação em até 48 horas úteis e enviaremos as instruções por e-mail.

Passo 3: Envio
Envie o produto conforme nossas instruções:
• Embale adequadamente para evitar danos no transporte
• Use preferencialmente a embalagem original
• Mantenha o código de rastreamento

Passo 4: Análise
Ao recebermos o produto, analisaremos as condições em até 3 dias úteis.

Passo 5: Finalização
• Se aprovado: Processaremos a troca ou reembolso
• Se reprovado: Devolveremos o produto e explicaremos o motivo

6. PRAZOS DE REEMBOLSO
Após a aprovação da devolução:
• Cartão de crédito: até 7 dias úteis (pode levar 1-2 faturas para aparecer)
• PIX/Débito: até 7 dias úteis
• Boleto: até 10 dias úteis (necessário enviar dados bancários)

7. IMPORTANTE
❌ Não aceitamos:
• Produtos lavados, usados ou sem etiqueta
• Produtos danificados por mau uso
• Devoluções sem solicitação prévia
• Produtos de terceiros enviados por engano

✅ Dicas para evitar trocas:
• Consulte a Guia de Medidas antes de comprar
• Leia atentamente a descrição do produto
• Tire dúvidas pelo WhatsApp antes de finalizar a compra
• Lembre-se: as peças podem encolher de 3-5%

8. CASOS ESPECIAIS
8.1 Produto Errado Enviado
Se enviamos um produto diferente do pedido, arcaremos com todos os custos de troca e devolução.

8.2 Produto Danificado no Transporte
Se o produto chegar danificado:
• Não recuse a encomenda na entrega
• Fotografe a embalagem e o produto
• Entre em contato imediatamente
Analisaremos o caso junto à transportadora

8.3 Produto Não Chegou
Se o prazo de entrega expirou, entre em contato para rastreamento. Após investigação com a transportadora, oferecemos reenvio ou reembolso.

9. CONTATO
Para solicitar troca ou devolução:
E-mail: streetstars.company@gmail.com
WhatsApp: https://wa.me/5511999999999

Horário de atendimento:
Segunda a Sexta: 9h às 18h
Sábado: 9h às 13h

Street Stars — São Paulo - SP
CNPJ: [Em registro]

Esta política está em conformidade com o Código de Defesa do Consumidor (Lei 8.078/90).`
  }
}

export default function LegalInfo() {
  const { slug } = useParams()
  const data = LEGAL_CONTENT[slug]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (!data) {
    return <Navigate to="/" replace />
  }

  return (
    <>
      <SEO 
        title={data.title}
        description={data.description}
        url={`/legal/${slug}`}
      >
        <meta name="robots" content="noindex, follow" />
      </SEO>

      <div className="min-h-screen bg-black text-white pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">

          <nav className="mb-8 text-xs text-white/40 uppercase tracking-widest" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            {' / '}
            <span className="text-white/60">Legal</span>
            {' / '}
            <span className="text-white">{data.title}</span>
          </nav>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-black uppercase italic mb-8 border-b border-white/20 pb-6"
          >
            {data.title}
          </motion.h1>

          <motion.article 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="prose prose-invert prose-sm md:prose-base max-w-none
                       prose-headings:font-black prose-headings:uppercase prose-headings:italic
                       prose-p:text-white/70 prose-p:leading-relaxed
                       prose-strong:text-white prose-strong:font-bold
                       prose-ul:text-white/70 prose-ul:list-disc
                       prose-a:text-white prose-a:underline hover:prose-a:text-white/70"
          >
            <div className="whitespace-pre-line">{data.content}</div>
          </motion.article>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 pt-8 border-t border-white/10"
          >
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-white/50 hover:text-white transition-colors group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              Voltar para Home
            </Link>
          </motion.div>

        </div>
      </div>
    </>
  )
}