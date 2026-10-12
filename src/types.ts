export interface Paragraph {
  heading: boolean
  text: string
}

export interface Doc {
  title: string
  subtitle?: string
  paragraphs: Paragraph[]
}

export interface Sentence {
  text: string
  para: number
}
