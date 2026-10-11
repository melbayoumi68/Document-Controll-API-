using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DC.DAL.Configurations
{
    public class ContractConfiguration : IEntityTypeConfiguration<Contract>
    {
        public void Configure(EntityTypeBuilder<Contract> e)
        {
            e.HasKey(x => x.ContractId);

            e.Property(x => x.ContractName)
                .HasMaxLength(200)
                .IsRequired();

            e.Property(x => x.ContractCode)
                .HasMaxLength(50)
                .IsRequired();

            e.HasIndex(x => x.ContractCode)
                .IsUnique();

            e.HasOne(x => x.Project)
                .WithMany(p => p.Contracts)
                .HasForeignKey(x => x.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}