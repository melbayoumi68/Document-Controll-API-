using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DC.DAL.Configurations
{
    public class TODepartmentConfigurations : IEntityTypeConfiguration<Department>
    {
        public void Configure(EntityTypeBuilder<Department> e)
        {
            e.HasKey(x => x.DepartmentId);
            e.Property(x => x.Name).HasMaxLength(150).IsRequired();
            e.HasIndex(x => x.Name).IsUnique();
            e.Property(x => x.Code).HasMaxLength(20);
        }
    }
}