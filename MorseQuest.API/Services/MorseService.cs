using System.Text;
using MorseQuest.API.Models;

namespace MorseQuest.API.Services;

public class MorseService
{
    private static readonly Dictionary<char, string> TextToMorse = new()
    {
        {'A', ".-"}, {'B', "-..."}, {'C', "-.-."}, {'D', "-.."},
        {'E', "."}, {'F', "..-."}, {'G', "--."}, {'H', "...."},
        {'I', ".."}, {'J', ".---"}, {'K', "-.-"}, {'L', ".-.."},
        {'M', "--"}, {'N', "-."}, {'O', "---"}, {'P', ".--."},
        {'Q', "--.-"}, {'R', ".-."}, {'S', "..."}, {'T', "-"},
        {'U', "..-"}, {'V', "...-"}, {'W', ".--"}, {'X', "-..-"},
        {'Y', "-.--"}, {'Z', "--.."},
        {'0', "-----"}, {'1', ".----"}, {'2', "..---"}, {'3', "...--"},
        {'4', "....-"}, {'5', "....."}, {'6', "-...."}, {'7', "--..."},
        {'8', "---.."}, {'9', "----."},
        {' ', "/"}, {'.', ".-.-.-"}, {',', "--..--"}, {'?', "..--.."},
        {'!', "-.-.--"}, {'-', "-....-"}, {'/', "-..-."}, {'@', ".--.-."},
        {'А', ".-"}, {'Б', "-..."}, {'В', ".--"}, {'Г', "--."},
        {'Д', "-.."}, {'Е', "."}, {'Ж', "...-"}, {'З', "--.."},
        {'И', ".."}, {'Й', ".---"}, {'К', "-.-"}, {'Л', ".-.."},
        {'М', "--"}, {'Н', "-."}, {'О', "---"}, {'П', ".--."},
        {'Р', ".-."}, {'С', "..."}, {'Т', "-"}, {'У', "..-"},
        {'Ф', "..-."}, {'Х', "...."}, {'Ц', "-.-."}, {'Ч', "---."},
        {'Ш', "----"}, {'Щ', "--.-"}, {'Ъ', "--.--"}, {'Ы', "-.--"},
        {'Ь', "-..-"}, {'Э', "..-.."}, {'Ю', "..--"}, {'Я', ".-.-"},
        {'Ё', "."}
    };

    private static readonly Dictionary<string, char> MorseToText =
        TextToMorse.GroupBy(x => x.Value)
                   .ToDictionary(g => g.Key, g => g.First().Key);

    private static readonly Random random = new();

    public string TranslateToMorse(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        text = text.ToUpper().Trim();
        var result = new StringBuilder();

        foreach (char c in text)
        {
            if (TextToMorse.ContainsKey(c))
            {
                if (result.Length > 0)
                    result.Append(' ');
                result.Append(TextToMorse[c]);
            }
        }

        return result.ToString();
    }

    public string TranslateFromMorse(string morseCode)
    {
        if (string.IsNullOrWhiteSpace(morseCode))
            return string.Empty;

        var result = new StringBuilder();
        var words = morseCode.Split('/');

        foreach (var word in words)
        {
            if (result.Length > 0 && words.Length > 1)
                result.Append(' ');

            var symbols = word.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);

            foreach (var symbol in symbols)
            {
                if (MorseToText.ContainsKey(symbol))
                {
                    result.Append(MorseToText[symbol]);
                }
            }
        }

        return result.ToString();
    }

    public TrainingQuestion GenerateTrainingQuestion()
    {
        var letters = TextToMorse.Keys
            .Where(c => char.IsLetter(c) || char.IsDigit(c))
            .ToList();

        var correct = letters[random.Next(letters.Count)];
        var morseCode = TextToMorse[correct];

        var options = new List<string> { correct.ToString() };

        while (options.Count < 4)
        {
            var option = letters[random.Next(letters.Count)].ToString();
            if (!options.Contains(option))
                options.Add(option);
        }

        options = options.OrderBy(x => random.Next()).ToList();

        return new TrainingQuestion
        {
            MorseCode = morseCode,
            CorrectAnswer = correct.ToString(),
            Options = options
        };
    }

    public bool CheckTrainingAnswer(string morseCode, string userAnswer)
    {
        if (MorseToText.ContainsKey(morseCode))
        {
            return string.Equals(MorseToText[morseCode].ToString(),
                                 userAnswer.ToUpper(),
                                 StringComparison.OrdinalIgnoreCase);
        }
        return false;
    }

    public List<QuestTask> GenerateQuestTasks(int count = 5)
    {
        var tasks = new List<QuestTask>();
        var words = new[] {
            "HELLO", "WORLD", "MORSE", "CODE", "SOS",
            "SIGNAL", "RADIO", "DOT", "DASH", "MESSAGE",
            "ПРИВЕТ", "МИР", "АЗБУКА", "СИГНАЛ", "РАДИО",
            "ТОЧКА", "ТИРЕ", "СВЯЗЬ", "ШИФР", "ТЕКСТ"
        };

        for (int i = 0; i < count; i++)
        {
            var word = words[random.Next(words.Length)];
            var morseCode = TranslateToMorse(word);

            var task = new QuestTask
            {
                Id = i + 1,
                Type = i < 3 ? "text" : "choice",
                Question = i < 3
                    ? $"Расшифруйте сообщение: {morseCode}"
                    : $"Выберите правильный перевод: {morseCode}",
                MorseCode = morseCode,
                CorrectAnswer = word,
                Points = 10 + (i * 5)
            };

            if (task.Type == "choice")
            {
                task.Options = new List<string> { word };
                while (task.Options.Count < 4)
                {
                    var option = words[random.Next(words.Length)];
                    if (!task.Options.Contains(option))
                        task.Options.Add(option);
                }
                task.Options = task.Options.OrderBy(x => random.Next()).ToList();
            }

            tasks.Add(task);
        }

        return tasks;
    }

    public int CalculateScore(int correctAnswers, int totalQuestions, int timeSeconds, string mode)
    {
        double accuracy = totalQuestions > 0 ? (double)correctAnswers / totalQuestions : 0;
        int baseScore = correctAnswers * 10;
        int timeBonus = timeSeconds < 60 ? 50 : timeSeconds < 120 ? 30 : timeSeconds < 180 ? 10 : 0;
        int accuracyBonus = accuracy >= 0.9 ? 20 : accuracy >= 0.7 ? 10 : 0;
        int modeMultiplier = mode == "quest" ? 2 : 1;

        return (baseScore + timeBonus + accuracyBonus) * modeMultiplier;
    }
}