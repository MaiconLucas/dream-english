import {
  Body,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'

export interface PaymentReminderEmailProps {
  studentName: string
  amount: number // in cents
  dueDate: string // formatted as "DD/MM/YYYY"
  daysUntilDue: 0 | 3
}

export function PaymentReminderEmail({
  studentName,
  amount,
  dueDate,
  daysUntilDue,
}: PaymentReminderEmailProps) {
  const isToday = daysUntilDue === 0
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount / 100)

  const previewText = isToday
    ? `Sua parcela de ${formattedAmount} vence hoje — regularize o pagamento.`
    : `Sua parcela de ${formattedAmount} vence em 3 dias — não esqueça!`

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={schoolName}>Dream English School</Text>
            <Text style={schoolSubtitle}>Lembrete de Pagamento</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={greeting}>
              Olá, <strong>{studentName}</strong>!
            </Text>

            {isToday ? (
              <Text style={message}>
                Sua parcela <strong>vence hoje</strong>. Para evitar cobranças
                adicionais, regularize o pagamento o quanto antes.
              </Text>
            ) : (
              <Text style={message}>
                Sua parcela vence <strong>em 3 dias</strong>. Aproveite para se
                organizar e realizar o pagamento com antecedência.
              </Text>
            )}

            {/* Payment details */}
            <Section style={detailsBox}>
              <Row>
                <Column style={detailCol}>
                  <Text style={detailLabel}>Vencimento</Text>
                  <Text style={detailValue}>{dueDate}</Text>
                </Column>
                <Column style={{ ...detailCol, textAlign: 'right' }}>
                  <Text style={detailLabel}>Valor</Text>
                  <Text style={amountValue}>{formattedAmount}</Text>
                </Column>
              </Row>
            </Section>

            <Hr style={divider} />

            <Text style={footerNote}>
              Em caso de dúvidas, entre em contato com a escola.
              {'\n'}Este é um e-mail automático — por favor, não responda.
            </Text>
          </Section>

          <Text style={copyright}>
            © {new Date().getFullYear()} Dream English School
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  backgroundColor: '#f8fafc',
  fontFamily: 'Arial, Helvetica, sans-serif',
  margin: '0',
  padding: '0',
}

const container = {
  maxWidth: '560px',
  margin: '40px auto',
  padding: '0 20px',
}

const header = {
  backgroundColor: '#1a56db',
  borderRadius: '12px 12px 0 0',
  padding: '24px 32px',
}

const schoolName = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '1.2',
}

const schoolSubtitle = {
  color: '#bfdbfe',
  fontSize: '14px',
  margin: '4px 0 0',
}

const content = {
  backgroundColor: '#ffffff',
  padding: '32px',
  borderRadius: '0 0 12px 12px',
  border: '1px solid #e2e8f0',
  borderTop: 'none',
}

const greeting = {
  fontSize: '16px',
  color: '#0f172a',
  margin: '0 0 16px',
  lineHeight: '1.5',
}

const message = {
  fontSize: '15px',
  color: '#64748b',
  lineHeight: '1.7',
  margin: '0 0 24px',
}

const detailsBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px 24px',
  marginBottom: '24px',
}

const detailCol = {
  width: '50%',
  verticalAlign: 'top' as const,
}

const detailLabel = {
  color: '#94a3b8',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  margin: '0 0 6px',
  fontWeight: '600',
}

const detailValue = {
  color: '#0f172a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
}

const amountValue = {
  color: '#1a56db',
  fontSize: '22px',
  fontWeight: '700',
  margin: '0',
}

const divider = {
  borderColor: '#e2e8f0',
  margin: '0 0 20px',
}

const footerNote = {
  fontSize: '12px',
  color: '#94a3b8',
  textAlign: 'center' as const,
  lineHeight: '1.7',
  margin: '0',
  whiteSpace: 'pre-line' as const,
}

const copyright = {
  fontSize: '11px',
  color: '#94a3b8',
  textAlign: 'center' as const,
  margin: '16px 0 40px',
}
