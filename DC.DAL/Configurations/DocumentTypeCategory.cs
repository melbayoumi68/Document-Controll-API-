using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DC.DAL.Configurations;

public class DocumentTypeCategoryConfiguration : IEntityTypeConfiguration<DocumentTypeCategory>
{
    public void Configure(EntityTypeBuilder<DocumentTypeCategory> e)
    {
        e.HasKey(x => new { x.DocumentTypeId, x.DocumentCategoryId });

        e.HasOne(x => x.DocumentType)
            .WithMany(t => t.DocumentTypeCategories)
            .HasForeignKey(x => x.DocumentTypeId)
            .OnDelete(DeleteBehavior.Cascade);

        e.HasOne(x => x.DocumentCategory)
            .WithMany(c => c.DocumentTypeCategories)
            .HasForeignKey(x => x.DocumentCategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        e.HasIndex(x => x.DocumentCategoryId);
    }
}
