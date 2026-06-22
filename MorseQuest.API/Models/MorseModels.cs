namespace MorseQuest.API.Models;

public class TranslateRequest
{
    public string Text { get; set; } = string.Empty;
    public bool IsMorseToText { get; set; } = false;
}

public class TranslateResponse
{
    public string Input { get; set; } = string.Empty;
    public string Output { get; set; } = string.Empty;
    public bool Success { get; set; } = true;
    public string? Error { get; set; }
}

public class TrainingQuestion
{
    public string MorseCode { get; set; } = string.Empty;
    public string CorrectAnswer { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
}

public class TrainingAnswer
{
    public string MorseCode { get; set; } = string.Empty;
    public string UserAnswer { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

public class GameResult
{
    public string Username { get; set; } = string.Empty;
    public int CorrectAnswers { get; set; }
    public int WrongAnswers { get; set; }
    public int TotalQuestions { get; set; }
    public int TimeSeconds { get; set; }
    public int Score { get; set; }
    public string Mode { get; set; } = "training";
}

public class QuestTask
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string MorseCode { get; set; } = string.Empty;
    public string CorrectAnswer { get; set; } = string.Empty;
    public List<string>? Options { get; set; }
    public int Points { get; set; } = 10;
}