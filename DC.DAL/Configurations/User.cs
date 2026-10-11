using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DC.DAL.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> e)
        {
            e.HasKey(x => x.UserId);
            e.HasIndex(x => x.Username).IsUnique();
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Username).HasMaxLength(100).IsRequired();
            e.Property(x => x.Email).HasMaxLength(150).IsRequired();
            e.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
            e.Property(x => x.FullName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Role).HasMaxLength(30).IsRequired();
            e.HasOne(x => x.Department).WithMany(d => d.Engineers).HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.SetNull);
        }
    }
}