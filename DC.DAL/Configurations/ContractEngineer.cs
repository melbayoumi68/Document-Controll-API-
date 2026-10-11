using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DC.DAL.Configurations
{
    public class ContractEngineerConfiguration : IEntityTypeConfiguration<ContractEngineer>
    {
        public void Configure(EntityTypeBuilder<ContractEngineer> e)
        {
            e.HasKey(x => x.ContractEngineerId);

            e.HasIndex(x => new { x.ContractId, x.UserId })
                .IsUnique();

            e.HasOne(x => x.Contract)
                .WithMany(c => c.Engineers)
                .HasForeignKey(x => x.ContractId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.User)
                .WithMany(u => u.ContractAssignments)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
