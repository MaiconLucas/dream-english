import LessonForm from './LessonForm'

export default function NewLessonPage({ params }: { params: { moduleId: string } }) {
  return <LessonForm moduleId={params.moduleId} />
}
