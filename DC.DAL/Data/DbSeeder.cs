using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;

namespace DC.DAL.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(
     AppDbContext db,
     Func<User, string, string>? hashPassword = null)
    {

        if (await db.Projects.AnyAsync()) return; // already seeded

        // Departments (22)
        var departments = new List<Department>();
        for (int i = 1; i <= 22; i++)
        {
            departments.Add(new Department
            {
                Name = $"Department {i:D2}",
                Code = $"DEP{i:D2}",
                IsActive = i % 5 != 0,
                CreatedAt = DateTime.UtcNow.AddDays(-i)
            });
        }
        db.Departments.AddRange(departments);
        await db.SaveChangesAsync();

        // DocumentTypes (22)
        var typeNames = new[] { "Drawing", "Specification", "Report", "Method Statement", "Inspection", "Material Submittal", "Calculation", "Schedule", "Manual", "Certificate", "Procedure", "Plan", "Survey", "Test Report", "As-Built", "RFI", "Change Order", "Minutes", "Checklist", "Photo Log", "Safety Doc", "QA Form" };
        for (int i = 0; i < 22; i++)
        {
            db.DocumentTypes.Add(new DocumentType
            {
                TypeName = typeNames[i],
                TypeAbbreviation = $"T{i + 1:D2}",
                IsActive = i % 6 != 0,
                IsDefault = i < 5,
                CreatedAt = DateTime.UtcNow.AddDays(-i)
            });
        }
        await db.SaveChangesAsync();

        // DocumentCategories (22)
        for (int i = 1; i <= 22; i++)
        {
            db.DocumentCategories.Add(new DocumentCategory
            {
                CategoryName = $"Category {i:D2}",
                CategoryCode = $"CAT{i:D2}",
                IsActive = i % 4 != 0,
                CreatedAt = DateTime.UtcNow.AddDays(-i)
            });
        }
        await db.SaveChangesAsync();

        // IR Document Type + discipline categories (SUR, CI, ARCH, MECH, ELEC, INFRA, LANDSCAPE, FENCE)
        var irType = new DocumentType
        {
            TypeName = "Inspection Request",
            TypeAbbreviation = "IR",
            IsActive = true,
            IsDefault = true,
            CreatedAt = DateTime.UtcNow
        };
        db.DocumentTypes.Add(irType);
        await db.SaveChangesAsync();

        var irCategoryDefs = new (string Name, string Code)[]
        {
            ("Survey", "SUR"),
            ("Civil", "CI"),
            ("Architecture", "ARCH"),
            ("Mechanical", "MECH"),
            ("Electrical", "ELEC"),
            ("Infrastructure", "INFRA"),
            ("Landscape", "LANDSCAPE"),
            ("Fence", "FENCE")
        };
        var irCategories = new List<DocumentCategory>();
        foreach (var (name, code) in irCategoryDefs)
        {
            var existing = await db.DocumentCategories.FirstOrDefaultAsync(c => c.CategoryCode == code);
            if (existing == null)
            {
                existing = new DocumentCategory
                {
                    CategoryName = name,
                    CategoryCode = code,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                db.DocumentCategories.Add(existing);
                await db.SaveChangesAsync();
            }
            irCategories.Add(existing);
        }

        foreach (var cat in irCategories)
        {
            db.DocumentTypeCategories.Add(new DocumentTypeCategory
            {
                DocumentTypeId = irType.TypeId,
                DocumentCategoryId = cat.CategoryId
            });
        }
        await db.SaveChangesAsync();

        // Link each seeded generic type to a few active categories so Submit validation has data
        var allTypes = await db.DocumentTypes.Where(t => t.TypeAbbreviation != "IR").ToListAsync();
        var activeCats = await db.DocumentCategories.Where(c => c.IsActive).OrderBy(c => c.CategoryId).ToListAsync();
        if (activeCats.Count > 0)
        {
            foreach (var t in allTypes)
            {
                // Link first 3 active categories to each type (demo data)
                foreach (var cat in activeCats.Take(3))
                {
                    db.DocumentTypeCategories.Add(new DocumentTypeCategory
                    {
                        DocumentTypeId = t.TypeId,
                        DocumentCategoryId = cat.CategoryId
                    });
                }
            }
            await db.SaveChangesAsync();
        }

        // Contractors (22)
        for (int i = 1; i <= 22; i++)
        {
            db.Contractors.Add(new Contractor
            {
                Name = $"Contractor Company {i:D2}",
                Abbreviation = $"C{i:D2}",
                IsActive = i % 5 != 0,
                CreatedAt = DateTime.UtcNow.AddDays(-i)
            });
        }
        await db.SaveChangesAsync();

        // Projects (22)
        for (int i = 1; i <= 22; i++)
        {
            db.Projects.Add(new Project
            {
                ProjectName = $"Project {i:D2} - Infrastructure",
                ProjectCode = $"PRJ{i:D2}",
                Region = i % 2 == 0 ? "North" : "South",
                Description = $"Technical office project number {i}",
                IsActive = i % 7 != 0,
                CreatedAt = DateTime.UtcNow.AddDays(-30 + i)
            });
        }
        await db.SaveChangesAsync();

        // Contracts (22) - linked to projects 1-11 cycling
        var projects = await db.Projects.OrderBy(p => p.ProjectId).ToListAsync();
        for (int i = 1; i <= 22; i++)
        {
            var project = projects[(i - 1) % projects.Count];
            db.Contracts.Add(new Contract
            {
                ProjectId = project.ProjectId,
                ContractName = $"Contract {i:D2} - Works Package",
                ContractCode = $"CTR{i:D2}",
                StartDate = DateTime.UtcNow.AddMonths(-i),
                IsActive = i % 6 != 0,
                CreatedAt = DateTime.UtcNow.AddDays(-20 + i)
            });
        }
        await db.SaveChangesAsync();

        // Users (25) — passwords hashed (seed only in Development)
        var depts = await db.Departments.OrderBy(d => d.DepartmentId).ToListAsync();
        var seedPassword = Environment.GetEnvironmentVariable("DC_SEED_PASSWORD") ?? "password123";

        void AddUser(string username, string email, string fullName, string role, int? departmentId)
        {
            var u = new User
            {
                Username = username,
                Email = email,
                FullName = fullName,
                Role = role,
                DepartmentId = departmentId,
                IsActive = true,
                MustSetPassword = false,
                FailedLoginAttempts = 0,
                IsLocked = false,
                CreatedAt = DateTime.UtcNow
            };
            // Hash if PasswordService provided; otherwise leave a non-login placeholder
            u.PasswordHash = hashPassword != null
    ? hashPassword(u, seedPassword)
    : "SEED_HASH_PENDING";
            db.Users.Add(u);
        }

        for (int i = 1; i <= 3; i++)
        {
            AddUser($"admin{i}", $"admin{i}@dc.com", $"Super Admin {i}", Roles.SuperAdmin, depts[0].DepartmentId);
        }

        for (int i = 1; i <= 12; i++)
        {
            AddUser($"eng{i:D2}", $"eng{i:D2}@dc.com", $"TO Engineer {i:D2}", Roles.ToEngineer, depts[i % depts.Count].DepartmentId);
        }

        for (int i = 1; i <= 10; i++)
        {
            AddUser($"cons{i:D2}", $"cons{i:D2}@dc.com", $"Consultant {i:D2}", Roles.Consultant, null);
        }
        await db.SaveChangesAsync();

        var users = await db.Users.OrderBy(u => u.UserId).ToListAsync();
        var engineers = users.Where(u => u.Role == Roles.ToEngineer).ToList();
        var consultants = users.Where(u => u.Role == Roles.Consultant).ToList();
        var contracts = await db.Contracts.OrderBy(c => c.ContractId).ToListAsync();

        // ContractEngineers (22+)
        int engAssign = 0;
        foreach (var contract in contracts)
        {
            var eng = engineers[engAssign % engineers.Count];
            db.ContractEngineers.Add(new ContractEngineer
            {
                ContractId = contract.ContractId,
                UserId = eng.UserId,
                AssignedAt = DateTime.UtcNow.AddDays(-10)
            });
            engAssign++;
            if (engAssign < engineers.Count)
            {
                var eng2 = engineers[(engAssign) % engineers.Count];
                if (eng2.UserId != eng.UserId)
                {
                    db.ContractEngineers.Add(new ContractEngineer
                    {
                        ContractId = contract.ContractId,
                        UserId = eng2.UserId,
                        AssignedAt = DateTime.UtcNow.AddDays(-9)
                    });
                    engAssign++;
                }
            }
            if (engAssign >= 22) break;
        }
        await db.SaveChangesAsync();

        // ContractConsultants (22+)
        int consAssign = 0;
        foreach (var contract in contracts)
        {
            var cons = consultants[consAssign % consultants.Count];
            db.ContractConsultants.Add(new ContractConsultant
            {
                ContractId = contract.ContractId,
                UserId = cons.UserId,
                AssignedAt = DateTime.UtcNow.AddDays(-8),
                InvitationSent = consAssign % 2 == 0,
                InvitationSentAt = consAssign % 2 == 0 ? DateTime.UtcNow.AddDays(-7) : null
            });
            consAssign++;
            if (consAssign >= 22) break;
        }
        await db.SaveChangesAsync();

        var types = await db.DocumentTypes.OrderBy(t => t.TypeId).ToListAsync();
        var cats = await db.DocumentCategories.OrderBy(c => c.CategoryId).ToListAsync();
        var contractors = await db.Contractors.OrderBy(c => c.ContractorId).ToListAsync();

        // Documents (22)
        for (int i = 1; i <= 22; i++)
        {
            var contract = contracts[(i - 1) % contracts.Count];
            var eng = engineers[(i - 1) % engineers.Count];
            db.Documents.Add(new Document
            {
                DocumentNumber = $"DOC-{i:D4}",
                ContractId = contract.ContractId,
                DocumentTypeId = types[(i - 1) % types.Count].TypeId,
                DocumentCategoryId = cats[(i - 1) % cats.Count].CategoryId,
                ContractorId = contractors[(i - 1) % contractors.Count].ContractorId,
                SerialNumber = $"{i:D3}",
                Status = i % 3 == 0 ? DocumentStatuses.Approved : DocumentStatuses.PendingReview,
                Title = $"Document Title {i:D2}",
                Description = $"Seeded document {i}",
                CreatedByUserId = eng.UserId,
                CurrentVersionNumber = "01",
                CreatedAt = DateTime.UtcNow.AddDays(-15 + i)
            });
        }
        await db.SaveChangesAsync();

        var documents = await db.Documents.OrderBy(d => d.DocumentId).ToListAsync();

        // DocumentVersions (22+)
        for (int i = 0; i < documents.Count; i++)
        {
            var doc = documents[i];
            var eng = engineers[i % engineers.Count];
            db.DocumentVersions.Add(new DocumentVersion
            {
                DocumentId = doc.DocumentId,
                VersionNumber = "01",
                FileName = $"file_{i + 1:D2}.pdf",
                FilePath = $"/uploads/file_{i + 1:D2}.pdf",
                FileContentType = "application/pdf",
                FileSizeBytes = 100000 + i * 1000,
                UploadedByUserId = eng.UserId,
                UploadedAt = DateTime.UtcNow.AddDays(-14 + i),
                ReviewStatus = DocumentStatuses.PendingReview,
                Notes = $"Initial version for document {doc.DocumentNumber}"
            });
        }
        await db.SaveChangesAsync();

        var versions = await db.DocumentVersions.OrderBy(v => v.VersionId).ToListAsync();

        // ConsultantReviews (22)
        for (int i = 0; i < Math.Min(22, versions.Count); i++)
        {
            var cons = consultants[i % consultants.Count];
            db.ConsultantReviews.Add(new ConsultantReview
            {
                VersionId = versions[i].VersionId,
                ConsultantUserId = cons.UserId,
                Rating = (i % 4) switch { 0 => "A", 1 => "B", 2 => "C", _ => "D" },
                Comments = $"Review comments for version {versions[i].VersionId}",
                ReviewDate = DateTime.UtcNow.AddDays(-5 + i % 5)
            });
        }
        await db.SaveChangesAsync();

        // Notifications (22)
        for (int i = 1; i <= 22; i++)
        {
            var user = users[(i - 1) % users.Count];
            db.Notifications.Add(new Notification
            {
                UserId = user.UserId,
                Title = $"Notification {i:D2}",
                Message = $"This is seeded notification number {i}",
                IsRead = i % 3 == 0,
                ProjectId = projects[(i - 1) % projects.Count].ProjectId,
                ContractId = contracts[(i - 1) % contracts.Count].ContractId,
                Type = i % 2 == 0 ? "Info" : "Alert",
                CreatedAt = DateTime.UtcNow.AddDays(-i)
            });
        }
        await db.SaveChangesAsync();

        // AuditLogs (22)
        for (int i = 1; i <= 22; i++)
        {
            var user = users[(i - 1) % users.Count];
            db.AuditLogs.Add(new AuditLog
            {
                UserId = user.UserId,
                Action = i % 3 == 0 ? "Create" : i % 3 == 1 ? "Update" : "View",
                EntityType = (i % 4) switch { 0 => "Project", 1 => "Contract", 2 => "Document", _ => "User" },
                EntityId = i,
                Details = $"Seeded audit entry {i}",
                Timestamp = DateTime.UtcNow.AddHours(-i)
            });
        }
        await db.SaveChangesAsync();
    }

    
}
