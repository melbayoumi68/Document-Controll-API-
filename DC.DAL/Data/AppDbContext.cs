using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;

namespace DC.DAL.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<ContractEngineer> ContractEngineers => Set<ContractEngineer>();
    public DbSet<ContractConsultant> ContractConsultants => Set<ContractConsultant>();
    public DbSet<DocumentType> DocumentTypes => Set<DocumentType>();
    public DbSet<DocumentCategory> DocumentCategories => Set<DocumentCategory>();
    public DbSet<DocumentTypeCategory> DocumentTypeCategories => Set<DocumentTypeCategory>();
    public DbSet<Contractor> Contractors => Set<Contractor>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DocumentVersion> DocumentVersions => Set<DocumentVersion>();
    public DbSet<ConsultantReview> ConsultantReviews => Set<ConsultantReview>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<DocumentCodingOrder> DocumentCodingOrders => Set<DocumentCodingOrder>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
