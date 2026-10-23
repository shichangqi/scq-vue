import type { ComponentSize } from '../ConfigProvider/context'

export type SelectValue = string | number
export type SelectSize = ComponentSize
export interface SelectOption { label: string; value: SelectValue; disabled?: boolean }
export interface SelectRemoteResult { list: SelectOption[]; total?: number }
export type RemoteResult = SelectRemoteResult
export type SelectRemoteMethod = (query: string, page: number, pageSize: number, signal: AbortSignal) => Promise<SelectOption[] | SelectRemoteResult> | SelectOption[] | SelectRemoteResult
