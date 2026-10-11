using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DC.DAL.Configurations
{
    public class DocumentTypeConfiguration : IEntityTypeConfiguration<DocumentType>
    {
        public void Configure(EntityTypeBuilder<DocumentType> e)
        {
            e.HasKey(x => x.TypeId);
            e.Property(x => x.TypeName).HasMaxLength(150).IsRequired();
            e.Property(x => x.TypeAbbreviation).HasMaxLength(20).IsRequired();
            e.HasIndex(x => x.TypeAbbreviation).IsUnique();

        }
    }
}
