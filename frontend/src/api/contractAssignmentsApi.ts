import { apiClient } from './client'
import {
  ContractAssignments,
  AssignEngineerDto,
  AssignConsultantDto,
  ContractEngineerAssignment,
  ContractConsultantAssignment,
} from '@/types'

export const contractAssignmentsApi = {
  getByContractId: async (contractId: number) => {
    const res = await apiClient.get<ContractAssignments>(
      `/ContractAssignment/contract/${contractId}`
    )
    return res.data
  },

  assignEngineer: async (data: AssignEngineerDto) => {
    const res = await apiClient.post<ContractEngineerAssignment>(
      '/ContractAssignment/engineer',
      data
    )
    return res.data
  },

  assignConsultant: async (data: AssignConsultantDto) => {
    const res = await apiClient.post<ContractConsultantAssignment>(
      '/ContractAssignment/consultant',
      data
    )
    return res.data
  },

  removeEngineer: async (assignmentId: number) => {
    await apiClient.delete(`/ContractAssignment/engineer/${assignmentId}`)
  },

  removeConsultant: async (assignmentId: number) => {
    await apiClient.delete(`/ContractAssignment/consultant/${assignmentId}`)
  },

  markInvitationSent: async (assignmentId: number) => {
    const res = await apiClient.put<ContractConsultantAssignment>(
      `/ContractAssignment/consultant/${assignmentId}/mark-invitation-sent`
    )
    return res.data
  },
}
