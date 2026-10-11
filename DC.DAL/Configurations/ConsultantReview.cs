using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DC.DAL.Configurations
{
    public class ConsultantReviewConfiguration : IEntityTypeConfiguration<ConsultantReview>
    {
        public void Configure(EntityTypeBuilder<ConsultantReview> e)
        {
            // "ReviewId" does not match EF's convention ("Id" or "ConsultantReviewId"),
            // so the key must be declared explicitly or the model fails to build.
            e.HasKey(x => x.ReviewId);

            e.Property(x => x.Rating).HasMaxLength(1).IsRequired();
            e.Property(x => x.Comments).HasMaxLength(2000);

            e.HasOne(x => x.Version)
                .WithMany(v => v.Reviews)
                .HasForeignKey(x => x.VersionId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.ConsultantUser)
                .WithMany()
                .HasForeignKey(x => x.ConsultantUserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
