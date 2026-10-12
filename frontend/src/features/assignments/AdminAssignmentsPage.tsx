import React, { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contractsApi, contractAssignmentsApi, usersApi } from '@/api'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Pagination } from '@/components/common/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Roles } from '@/types'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import {
  UserCheck,
  HardHat,
  Briefcase,
  Trash2,
  MailCheck,
  Send,
  Users,
} from 'lucide-react'

export const AdminAssignmentsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const location = useLocation()
  const preselectedContractId =
    (location.state as { contractId?: number } | null)?.contractId ?? null
  const [selectedContractId, setSelectedContractId] = useState<number | null>(
    preselectedContractId
  )
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedEngineerId, setSelectedEngineerId] = useState('')
  const [selectedConsultantId, setSelectedConsultantId] = useState('')

  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => contractsApi.getAll(),
  })

  const selectedContract = contracts.find((c) => c.contractId === selectedContractId) || null

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['contract-assignments', selectedContractId],
    queryFn: () => contractAssignmentsApi.getByContractId(selectedContractId!),
    enabled: !!selectedContractId,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: () => usersApi.getAll(true),
    enabled: !!selectedContractId,
  })

  const engineers = users.filter((u) => u.role === Roles.ToEngineer)
  const consultants = users.filter((u) => u.role === Roles.Consultant)

  const pagedContracts = useMemo(() => {
    const start = (page - 1) * pageSize
    return contracts.slice(start, start + pageSize)
  }, [contracts, page, pageSize])

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  const selectContract = (contractId: number) => {
    setSelectedContractId(contractId)
    setSelectedEngineerId('')
    setSelectedConsultantId('')
  }

  const assignEngMutation = useMutation({
    mutationFn: async (userId: number) => {
      if (!selectedContract) throw new Error('Contract details missing')
      return await contractAssignmentsApi.assignEngineer({
        contractId: selectedContract.contractId,
        projectId: selectedContract.projectId,
        userId,
      })
    },
    onSuccess: () => {
      toast.success('Engineer assigned to contract!')
      setSelectedEngineerId('')
      queryClient.invalidateQueries({ queryKey: ['contract-assignments', selectedContractId] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })

  const assignConsMutation = useMutation({
    mutationFn: async (userId: number) => {
      if (!selectedContract) throw new Error('Contract details missing')
      return await contractAssignmentsApi.assignConsultant({
        contractId: selectedContract.contractId,
        projectId: selectedContract.projectId,
        userId,
      })
    },
    onSuccess: () => {
      toast.success('Consultant assigned to contract!')
      setSelectedConsultantId('')
      queryClient.invalidateQueries({ queryKey: ['contract-assignments', selectedContractId] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })

  const removeEngMutation = useMutation({
    mutationFn: (assignmentId: number) => contractAssignmentsApi.removeEngineer(assignmentId),
    onSuccess: () => {
      toast.success('Engineer removed from contract.')
      queryClient.invalidateQueries({ queryKey: ['contract-assignments', selectedContractId] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })

  const removeConsMutation = useMutation({
    mutationFn: (assignmentId: number) => contractAssignmentsApi.removeConsultant(assignmentId),
    onSuccess: () => {
      toast.success('Consultant removed from contract.')
      queryClient.invalidateQueries({ queryKey: ['contract-assignments', selectedContractId] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })

  const markInviteMutation = useMutation({
    mutationFn: (assignmentId: number) =>
      contractAssignmentsApi.markInvitationSent(assignmentId),
    onSuccess: () => {
      toast.success('Invitation marked as sent!')
      queryClient.invalidateQueries({ queryKey: ['contract-assignments', selectedContractId] })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Assign Technical Office Engineers and Consultants to contracts. Available exclusively to Super Admin."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin' }, { label: 'Assignments' }]}
      />

      {/* Contract Selection List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-500" />
            <span>Select a Contract to Manage ({contracts.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contractsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : contracts.length === 0 ? (
            <EmptyState
              title="No contracts"
              description="Create contracts first before assigning engineers and consultants."
            />
          ) : (
            <>
              <div className="overflow-x-auto -mx-6 -mt-6">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Contract Code</th>
                      <th className="py-3 px-4">Contract Name</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Engineers</th>
                      <th className="py-3 px-4">Consultants</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pagedContracts.map((contract) => (
                      <tr
                        key={contract.contractId}
                        className={`transition-colors ${
                          contract.contractId === selectedContractId
                            ? 'bg-blue-50/70 dark:bg-blue-950/30'
                            : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {contract.contractCode}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {contract.contractName || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {contract.projectName || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                          {contract.engineersCount ?? '—'}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                          {contract.consultantsCount ?? '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            variant={
                              contract.contractId === selectedContractId ? 'primary' : 'outline'
                            }
                            className="h-7 text-xs"
                            onClick={() => selectContract(contract.contractId)}
                          >
                            {contract.contractId === selectedContractId ? 'Managing' : 'Manage'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                pageSize={pageSize}
                total={contracts.length}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Assignment Panel */}
      {selectedContract && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span>
                Assignments — {selectedContract.contractCode}{' '}
                <span className="font-normal text-slate-400">
                  ({selectedContract.projectName || 'No project'})
                </span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignmentsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* Engineers Section */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2 mb-3">
                    <HardHat className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Technical Office Engineers (Submittal Rights)
                    </h4>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Assign Engineer
                    </label>
                    <div className="flex gap-2">
                      <Select
                        value={selectedEngineerId}
                        onChange={(e) => setSelectedEngineerId(e.target.value)}
                        placeholder="Select an engineer..."
                        className="text-xs"
                      >
                        {engineers.map((eng) => (
                          <option key={eng.userId} value={eng.userId}>
                            {eng.fullName} ({eng.email})
                          </option>
                        ))}
                      </Select>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={!selectedEngineerId || assignEngMutation.isPending}
                        isLoading={assignEngMutation.isPending}
                        onClick={() => assignEngMutation.mutate(parseInt(selectedEngineerId, 10))}
                      >
                        Assign
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {assignments?.engineers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No engineers assigned yet.</p>
                    ) : (
                      assignments?.engineers.map((a) => {
                        const userObj = users.find((u) => u.userId === a.userId)
                        return (
                          <div
                            key={a.contractEngineerId}
                            className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {userObj?.fullName || `User #${a.userId}`}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Assigned on {formatDate(a.assignedAt)}
                              </p>
                            </div>
                            <button
                              onClick={() => removeEngMutation.mutate(a.contractEngineerId)}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              title="Remove assignment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Consultants Section */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Consultants (Review & Approval Rights)
                    </h4>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Assign Consultant
                    </label>
                    <div className="flex gap-2">
                      <Select
                        value={selectedConsultantId}
                        onChange={(e) => setSelectedConsultantId(e.target.value)}
                        placeholder="Select a consultant..."
                        className="text-xs"
                      >
                        {consultants.map((cons) => (
                          <option key={cons.userId} value={cons.userId}>
                            {cons.fullName} ({cons.email})
                          </option>
                        ))}
                      </Select>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={!selectedConsultantId || assignConsMutation.isPending}
                        isLoading={assignConsMutation.isPending}
                        onClick={() =>
                          assignConsMutation.mutate(parseInt(selectedConsultantId, 10))
                        }
                      >
                        Assign
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {assignments?.consultants.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No consultants assigned yet.</p>
                    ) : (
                      assignments?.consultants.map((c) => {
                        const userObj = users.find((u) => u.userId === c.userId)
                        return (
                          <div
                            key={c.contractConsultantId}
                            className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {userObj?.fullName || `User #${c.userId}`}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-400">
                                  Assigned: {formatDate(c.assignedAt)}
                                </span>
                                {c.invitationSent ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                    <MailCheck className="w-3 h-3" /> Invited (
                                    {formatDate(c.invitationSentAt)})
                                  </span>
                                ) : (
                                  <button
                                    onClick={() =>
                                      markInviteMutation.mutate(c.contractConsultantId)
                                    }
                                    className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer underline"
                                  >
                                    <Send className="w-2.5 h-2.5" /> Mark invitation sent
                                  </button>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => removeConsMutation.mutate(c.contractConsultantId)}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              title="Remove consultant assignment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
