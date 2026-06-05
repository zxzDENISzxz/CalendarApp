using Microsoft.EntityFrameworkCore;
using CalendarApp.Api.Entities;

namespace CalendarApp.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<TaskItem> Tasks => Set<TaskItem>();
        public DbSet<Group> Groups => Set<Group>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure relationships and constraints here if needed
            modelBuilder.Entity<TaskItem>()
                .HasMany(t => t.Users)
                .WithMany(u => u.Tasks);
        }
    }
}