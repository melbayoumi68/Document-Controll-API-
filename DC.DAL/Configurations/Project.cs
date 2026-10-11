using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DC.DAL.Configurations;

public class ProjectConfigurations : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> e)
    {
        e.HasKey(x => x.ProjectId);
        e.Property(x => x.ProjectName).HasMaxLength(200).IsRequired();
        e.Property(x => x.ProjectCode).HasMaxLength(50).IsRequired();
        e.HasIndex(x => x.ProjectCode).IsUnique();
        e.Property(x => x.Region).HasMaxLength(150);
        e.Property(x => x.Description).HasMaxLength(2000);

        e.HasOne(x => x.CreatedByUser)
            .WithMany()
            .HasForeignKey(x => x.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
