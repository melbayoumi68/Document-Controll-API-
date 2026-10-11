using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DC.DAL.Configurations
{
    public class ContractConsultantConfiguration : IEntityTypeConfiguration<ContractConsultant>
    {
        public void Configure(EntityTypeBuilder<ContractConsultant> e)
        {
            e.HasKey(x => x.ContractConsultantId);
            e.HasIndex(x => new { x.ContractId, x.UserId }).IsUnique();
            e.HasOne(x => x.Contract).WithMany(c => c.Consultants).HasForeignKey(x => x.ContractId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany(u => u.ConsultantAssignments).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        }
    }
}