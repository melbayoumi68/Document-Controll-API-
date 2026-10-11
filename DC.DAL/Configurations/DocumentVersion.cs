using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using DC.DAL.Models;
namespace DC.DAL.Configurations
{
    public class DocumentVersionConfiguration : IEntityTypeConfiguration<DocumentVersion>
    {
        public void Configure(EntityTypeBuilder<DocumentVersion> e)
        {
            e.HasKey(x => x.VersionId);
            e.Property(x => x.VersionNumber).HasMaxLength(10).IsRequired();
            e.Property(x => x.ReviewStatus).HasMaxLength(40).IsRequired();

            e.Property(x => x.FileName).HasMaxLength(260);
            e.Property(x => x.FilePath).HasMaxLength(500);
            e.Property(x => x.FileContentType).HasMaxLength(150);
            e.Property(x => x.Notes).HasMaxLength(2000);

            // A given document cannot have the same version number twice (e.g. two "02" versions)
            e.HasIndex(x => new { x.DocumentId, x.VersionNumber }).IsUnique();

            e.HasOne(x => x.Document).WithMany(d => d.Versions).HasForeignKey(x => x.DocumentId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.UploadedByUser).WithMany().HasForeignKey(x => x.UploadedByUserId).OnDelete(DeleteBehavior.Restrict);
        }
    }
}
