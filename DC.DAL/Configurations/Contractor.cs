using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DC.DAL.Configurations
{
    public class ContractorConfiguration : IEntityTypeConfiguration<Contractor>
    {
        public void Configure(EntityTypeBuilder<Contractor> e)
        {
            e.HasKey(x => x.ContractorId);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Abbreviation).HasMaxLength(20).IsRequired();

            // Abbreviation is used inside the Document Number, so it must be unique
            e.HasIndex(x => x.Abbreviation).IsUnique();
        }
    }
}