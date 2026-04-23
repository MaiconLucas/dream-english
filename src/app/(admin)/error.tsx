'use client'

export default function AdminError({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-danger font-medium mb-2">Erro ao carregar a página</p>
      <p className="text-sm text-text-muted">{error.message}</p>
    </div>
  )
}
