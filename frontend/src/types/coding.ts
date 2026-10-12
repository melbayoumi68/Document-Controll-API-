export type CodingPart =
  | 'ProjectCode'
  | 'FormAbbreviation'
  | 'ContractorAbbreviation'
  | 'CategoryCode'
  | 'Serial'
  | 'Revision'

export interface CodingOrderItem {
  part: CodingPart
  sortOrder: number
  displayLabel: string
}

export interface UpdateCodingOrderDto {
  orderedParts: CodingPart[]
}

/** القيم الافتراضية عند فشل الجلب أو قبل تحميل الـ API */
export const DEFAULT_CODING_ORDER: CodingOrderItem[] = [
  { part: 'ProjectCode', sortOrder: 1, displayLabel: 'Project' },
  { part: 'FormAbbreviation', sortOrder: 2, displayLabel: 'FormType' },
  { part: 'ContractorAbbreviation', sortOrder: 3, displayLabel: 'Contractor' },
  { part: 'CategoryCode', sortOrder: 4, displayLabel: 'Category' },
  { part: 'Serial', sortOrder: 5, displayLabel: 'Serial' },
  { part: 'Revision', sortOrder: 6, displayLabel: 'Revision' },
]
