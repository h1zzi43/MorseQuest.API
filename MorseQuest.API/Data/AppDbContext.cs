using Microsoft.EntityFrameworkCore;

namespace MorseQuest.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<TrainingResult> TrainingResults { get; set; } = null!;
    public DbSet<LeaderboardEntry> Leaderboard { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<TrainingResult>(entity =>
        {
            entity.ToTable("training_results");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.Username).HasColumnName("username").IsRequired().HasMaxLength(100);
            entity.Property(e => e.CorrectAnswers).HasColumnName("correct_answers");
            entity.Property(e => e.WrongAnswers).HasColumnName("wrong_answers");
            entity.Property(e => e.TotalQuestions).HasColumnName("total_questions");
            entity.Property(e => e.TimeSeconds).HasColumnName("time_seconds");
            entity.Property(e => e.Score).HasColumnName("score");
            entity.Property(e => e.Mode).HasColumnName("mode").IsRequired().HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<LeaderboardEntry>(entity =>
        {
            entity.ToTable("leaderboard");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.Username).HasColumnName("username").IsRequired().HasMaxLength(100);
            entity.Property(e => e.Score).HasColumnName("score");
            entity.Property(e => e.Mode).HasColumnName("mode").IsRequired().HasMaxLength(50);
            entity.Property(e => e.CompletedAt).HasColumnName("completed_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(e => e.Score).HasDatabaseName("idx_leaderboard_score").IsDescending();
        });
    }
}

public class TrainingResult
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public int CorrectAnswers { get; set; }
    public int WrongAnswers { get; set; }
    public int TotalQuestions { get; set; }
    public int TimeSeconds { get; set; }
    public int Score { get; set; }
    public string Mode { get; set; } = "training";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class LeaderboardEntry
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public int Score { get; set; }
    public string Mode { get; set; } = string.Empty;
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}