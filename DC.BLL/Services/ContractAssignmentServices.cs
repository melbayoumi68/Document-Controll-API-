using DC.DAL.Data;
using DC.BLL.Dtos.ContractAssignment;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;

namespace DC.BLL.Services
{
    public class ContractAssignmentServices : IContractAssignment
    {
        private readonly AppDbContext _db;
        private readonly IEmailService _email;
        private readonly IEmailTemplateService _emailTemplate;

        public ContractAssignmentServices(
            AppDbContext db,
            IEmailService email,
            IEmailTemplateService emailTemplate)
        {
            _db = db;
            _email = email;
            _emailTemplate = emailTemplate;
        }

        // =========================================================
        // ASSIGN CONSULTANT
        // =========================================================
        public async Task<ContractConsultantAssignmentDto> AssignConsultantAsync(
            AssignContractConsultantDto dto)
        {
            // 1. Check Contract
            var contract = await _db.Contracts
                .Include(x => x.Project)
                .FirstOrDefaultAsync(x => x.ContractId == dto.ContractId);

            if (contract == null)
            {
                throw new KeyNotFoundException(
                    "Contract not found.");
            }

            // 2. Check that Contract belongs to selected Project
            if (contract.ProjectId != dto.ProjectId)
            {
                throw new InvalidOperationException(
                    "The selected contract does not belong to the selected project.");
            }

            // 3. Check User
            var user = await _db.Users
                .FirstOrDefaultAsync(x => x.UserId == dto.UserId);

            if (user == null)
            {
                throw new KeyNotFoundException(
                    "User not found.");
            }

            // 4. Check User Role
            if (user.Role != Roles.Consultant)
            {
                throw new InvalidOperationException(
                    "The selected user is not a Consultant.");
            }

            // 5. Check duplicate assignment
            var alreadyAssigned = await _db.ContractConsultants
                .AnyAsync(x =>
                    x.ContractId == dto.ContractId &&
                    x.UserId == dto.UserId);

            if (alreadyAssigned)
            {
                throw new InvalidOperationException(
                    "This consultant is already assigned to the contract.");
            }

            // 6. Create assignment
            var assignment = new ContractConsultant
            {
                ContractId = dto.ContractId,
                UserId = dto.UserId,
                AssignedAt = DateTime.UtcNow,
                InvitationSent = false,
                InvitationSentAt = null
            };

            _db.ContractConsultants.Add(assignment);

            await _db.SaveChangesAsync();

            // Email notification (non-blocking)
            await SendAssignmentEmailAsync(user, contract, "Consultant");

            // 7. Return result
            return new ContractConsultantAssignmentDto
            {
                ContractConsultantId = assignment.ContractConsultantId,
                ContractId = assignment.ContractId,
                ProjectId = contract.ProjectId,
                ProjectName = contract.Project.ProjectName,
                UserId = assignment.UserId,
                AssignedAt = assignment.AssignedAt,
                InvitationSent = assignment.InvitationSent,
                InvitationSentAt = assignment.InvitationSentAt
            };
        }

        // =========================================================
        // ASSIGN ENGINEER
        // =========================================================
        public async Task<ContractEngineerAssignmentDto> AssignEngineerAsync(
            AssignContractEngineerDto dto)
        {
            // 1. Check Contract
            var contract = await _db.Contracts
                .Include(x => x.Project)
                .FirstOrDefaultAsync(x => x.ContractId == dto.ContractId);

            if (contract == null)
            {
                throw new KeyNotFoundException(
                    "Contract not found.");
            }

            // 2. Check that Contract belongs to selected Project
            if (contract.ProjectId != dto.ProjectId)
            {
                throw new InvalidOperationException(
                    "The selected contract does not belong to the selected project.");
            }

            // 3. Check User
            var user = await _db.Users
                .FirstOrDefaultAsync(x => x.UserId == dto.UserId);

            if (user == null)
            {
                throw new KeyNotFoundException(
                    "User not found.");
            }

            // 4. Check User Role
            if (user.Role != Roles.ToEngineer)
            {
                throw new InvalidOperationException(
                    "The selected user is not a Technical Office Engineer.");
            }

            // 5. Check duplicate assignment
            var alreadyAssigned = await _db.ContractEngineers
                .AnyAsync(x =>
                    x.ContractId == dto.ContractId &&
                    x.UserId == dto.UserId);

            if (alreadyAssigned)
            {
                throw new InvalidOperationException(
                    "This engineer is already assigned to the contract.");
            }

            // 6. Create assignment
            var assignment = new ContractEngineer
            {
                ContractId = dto.ContractId,
                UserId = dto.UserId,
                AssignedAt = DateTime.UtcNow
            };

            _db.ContractEngineers.Add(assignment);

            await _db.SaveChangesAsync();

            // Email notification (non-blocking)
            await SendAssignmentEmailAsync(user, contract, "Technical Office Engineer");

            // 7. Return result
            return new ContractEngineerAssignmentDto
            {
                ContractEngineerId = assignment.ContractEngineerId,
                ContractId = assignment.ContractId,
                ProjectId = contract.ProjectId,
                ProjectName = contract.Project.ProjectName,
                UserId = assignment.UserId,
                AssignedAt = assignment.AssignedAt
            };
        }

        // =========================================================
        // GET ASSIGNMENTS BY CONTRACT
        // =========================================================
        public async Task<ContractAssignmentDto?> GetByContractIdAsync(
            int contractId)
        {
            // Check Contract
            var contract = await _db.Contracts
                .FirstOrDefaultAsync(x => x.ContractId == contractId);

            if (contract == null)
            {
                return null;
            }

            // Get Engineers
            var engineers = await _db.ContractEngineers
                .AsNoTracking()
                .Where(x => x.ContractId == contractId)
                .OrderBy(x => x.ContractEngineerId)
                .Select(x => new ContractEngineerAssignmentDto
                {
                    ContractEngineerId = x.ContractEngineerId,
                    ContractId = x.ContractId,
                    ProjectId = x.Contract.ProjectId,
                    ProjectName = x.Contract.Project.ProjectName,
                    UserId = x.UserId,
                    AssignedAt = x.AssignedAt
                })
                .ToListAsync();

            // Get Consultants
            var consultants = await _db.ContractConsultants
                .AsNoTracking()
                .Where(x => x.ContractId == contractId)
                .OrderBy(x => x.ContractConsultantId)
                .Select(x => new ContractConsultantAssignmentDto
                {
                    ContractConsultantId = x.ContractConsultantId,
                    ContractId = x.ContractId,
                    ProjectId = x.Contract.ProjectId,
                    ProjectName = x.Contract.Project.ProjectName,
                    UserId = x.UserId,
                    AssignedAt = x.AssignedAt,
                    InvitationSent = x.InvitationSent,
                    InvitationSentAt = x.InvitationSentAt
                })
                .ToListAsync();

            // Return all assignments
            return new ContractAssignmentDto
            {
                ContractId = contractId,
                Engineers = engineers,
                Consultants = consultants
            };
        }

        // =========================================================
        // REMOVE CONSULTANT
        // =========================================================

        private async Task SendAssignmentEmailAsync(User user, Contract contract, string role)
        {
            try
            {
                if (!user.IsActive || string.IsNullOrWhiteSpace(user.Email))
                    return;

                var projectName = contract.Project?.ProjectName ?? string.Empty;
                var msg = _emailTemplate.BuildContractAssignment(
                    new[] { user.Email },
                    projectName,
                    contract.ContractName,
                    role,
                    contract.ProjectId,
                    contract.ContractId);
                await _email.SendAsync(msg);
            }
            catch
            {
                // Swallow — email must never break assignment workflow
            }
        }

        public async Task RemoveConsultantAsync(
            int contractConsultantId)
        {
            var assignment = await _db.ContractConsultants
                .FirstOrDefaultAsync(
                    x => x.ContractConsultantId == contractConsultantId);

            if (assignment == null)
            {
                throw new KeyNotFoundException(
                    "Consultant assignment not found.");
            }

            _db.ContractConsultants.Remove(assignment);

            await _db.SaveChangesAsync();
        }

        // =========================================================
        // REMOVE ENGINEER
        // =========================================================
        public async Task RemoveEngineerAsync(
            int contractEngineerId)
        {
            var assignment = await _db.ContractEngineers
                .FirstOrDefaultAsync(
                    x => x.ContractEngineerId == contractEngineerId);

            if (assignment == null)
            {
                throw new KeyNotFoundException(
                    "Engineer assignment not found.");
            }

            _db.ContractEngineers.Remove(assignment);

            await _db.SaveChangesAsync();
        }

        public async Task<ContractConsultantAssignmentDto> MarkInvitationSentAsync(int contractConsultantId)
        {
            var assignment = await _db.ContractConsultants
                .Include(x => x.Contract)
                    .ThenInclude(c => c.Project)
                .FirstOrDefaultAsync(x => x.ContractConsultantId == contractConsultantId);

            if (assignment == null)
                throw new KeyNotFoundException("Consultant assignment not found.");

            assignment.InvitationSent = true;
            assignment.InvitationSentAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return new ContractConsultantAssignmentDto
            {
                ContractConsultantId = assignment.ContractConsultantId,
                ContractId = assignment.ContractId,
                ProjectId = assignment.Contract.ProjectId,
                ProjectName = assignment.Contract.Project.ProjectName,
                UserId = assignment.UserId,
                AssignedAt = assignment.AssignedAt,
                InvitationSent = assignment.InvitationSent,
                InvitationSentAt = assignment.InvitationSentAt
            };
        }

    }
}
