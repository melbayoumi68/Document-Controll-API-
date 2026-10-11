using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DC.DAL.Configurations;

public class DocumentCodingOrderConfiguration : IEntityTypeConfiguration<DocumentCodingOrder>
{
    public void Configure(EntityTypeBuilder<DocumentCodingOrder> builder)
    {
        builder.ToTable("DocumentCodingOrders");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Part)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.SortOrder).IsRequired();
        builder.Property(x => x.DisplayLabel).HasMaxLength(100);
        builder.Property(x => x.UpdatedAt).IsRequired();

        // كل جزء يظهر مرة واحدة فقط
        builder.HasIndex(x => x.Part).IsUnique();
        // الترتيب فريد
        builder.HasIndex(x => x.SortOrder).IsUnique();
    }
}
