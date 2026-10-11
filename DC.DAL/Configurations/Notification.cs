using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DC.DAL.Configurations
{
    public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
    {
        public void Configure(EntityTypeBuilder<Notification> e)
        {
            e.HasKey(x => x.NotificationId);

            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.Message).HasMaxLength(1000).IsRequired();
            e.Property(x => x.Type).HasMaxLength(50);

            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // ProjectId/ContractId/DocumentId/VersionId are intentionally left without navigation
            // FKs here to avoid additional cascade paths converging on Notifications; enforce them
            // at the service layer instead. Add explicit FK constraints later only if strictly needed.
        }
    }
}
