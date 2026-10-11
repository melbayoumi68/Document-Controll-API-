using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DC.Configurations
{
    public class DocumentConfiguration : IEntityTypeConfiguration<Document>
    {
        public void Configure(EntityTypeBuilder<Document> e)
        {
            e.HasKey(x => x.DocumentId);

            e.Property(x => x.DocumentNumber).HasMaxLength(120).IsRequired();
            e.HasIndex(x => x.DocumentNumber).IsUnique();

            e.Property(x => x.Status).HasMaxLength(40).IsRequired();

            e.Property(x => x.SerialNumber).HasMaxLength(10).IsRequired();
            e.Property(x => x.CurrentVersionNumber).HasMaxLength(10).IsRequired();

            e.Property(x => x.Title).HasMaxLength(300);
            e.Property(x => x.Description).HasMaxLength(2000);

            e.Property(x => x.InspectionRef).HasMaxLength(100);
            e.Property(x => x.Zone).HasMaxLength(100);
            e.Property(x => x.Building).HasMaxLength(100);
            e.Property(x => x.Axis).HasMaxLength(100);
            e.Property(x => x.Remarks).HasMaxLength(2000);

            e.HasIndex(x => new { x.ContractId, x.DocumentTypeId, x.DocumentCategoryId, x.ContractorId, x.SerialNumber })
                .IsUnique();

            e.HasOne(x => x.Contract).WithMany(c => c.Documents).HasForeignKey(x => x.ContractId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.DocumentType).WithMany().HasForeignKey(x => x.DocumentTypeId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.DocumentCategory).WithMany().HasForeignKey(x => x.DocumentCategoryId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Contractor).WithMany().HasForeignKey(x => x.ContractorId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.IssuedByUser).WithMany().HasForeignKey(x => x.IssuedByUserId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(x => x.DocumentControllerUser).WithMany().HasForeignKey(x => x.DocumentControllerUserId).OnDelete(DeleteBehavior.NoAction);
        }
    }
}
