using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DC.DAL.Configurations
{
    public class DocumentCategoryConfigurations : IEntityTypeConfiguration<DocumentCategory>
    {
        public void Configure(EntityTypeBuilder<DocumentCategory> e)
        {
            e.HasKey(x => x.CategoryId);
            e.Property(x => x.CategoryName).HasMaxLength(150).IsRequired();
            e.Property(x => x.CategoryCode).HasMaxLength(20).IsRequired();
            e.HasIndex(x => x.CategoryCode).IsUnique();
        }
    }
}