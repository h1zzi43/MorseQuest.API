using Microsoft.AspNetCore.Mvc;
using MorseQuest.API.Models;
using MorseQuest.API.Services;
using MorseQuest.API.Data;
using Microsoft.EntityFrameworkCore;

namespace MorseQuest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MorseController : ControllerBase
{
    private readonly MorseService _morseService;
    private readonly AudioService _audioService;
    private readonly AppDbContext _context;

    public MorseController(MorseService morseService, AudioService audioService, AppDbContext context)
    {
        _morseService = morseService;
        _audioService = audioService;
        _context = context;
    }

    [HttpPost("translate")]
    public ActionResult<TranslateResponse> Translate([FromBody] TranslateRequest request)
    {
        try
        {
            string output = request.IsMorseToText
                ? _morseService.TranslateFromMorse(request.Text)
                : _morseService.TranslateToMorse(request.Text);

            return Ok(new TranslateResponse
            {
                Input = request.Text,
                Output = output,
                Success = true
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new TranslateResponse
            {
                Input = request.Text,
                Output = string.Empty,
                Success = false,
                Error = ex.Message
            });
        }
    }

    [HttpPost("audio")]
    public IActionResult GetAudio([FromBody] TranslateRequest request)
    {
        try
        {
            string morseCode = request.IsMorseToText
                ? request.Text
                : _morseService.TranslateToMorse(request.Text);

            var audioBytes = _audioService.GenerateMorseAudio(morseCode);
            return File(audioBytes, "audio/wav", "morse.wav");
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("training/question")]
    public ActionResult<TrainingQuestion> GetTrainingQuestion()
    {
        try
        {
            var question = _morseService.GenerateTrainingQuestion();
            return Ok(question);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("training/check")]
    public ActionResult<TrainingAnswer> CheckTrainingAnswer([FromBody] TrainingAnswer answer)
    {
        try
        {
            answer.IsCorrect = _morseService.CheckTrainingAnswer(answer.MorseCode, answer.UserAnswer);
            return Ok(answer);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("results/save")]
    public async Task<ActionResult<GameResult>> SaveResult([FromBody] GameResult result)
    {
        try
        {
            result.Score = _morseService.CalculateScore(
                result.CorrectAnswers, result.TotalQuestions, result.TimeSeconds, result.Mode);

            var trainingResult = new TrainingResult
            {
                Username = result.Username,
                CorrectAnswers = result.CorrectAnswers,
                WrongAnswers = result.WrongAnswers,
                TotalQuestions = result.TotalQuestions,
                TimeSeconds = result.TimeSeconds,
                Score = result.Score,
                Mode = result.Mode
            };

            _context.TrainingResults.Add(trainingResult);

            var leaderEntry = new LeaderboardEntry
            {
                Username = result.Username,
                Score = result.Score,
                Mode = result.Mode
            };
            _context.Leaderboard.Add(leaderEntry);

            await _context.SaveChangesAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("leaderboard")]
    public async Task<ActionResult<List<object>>> GetLeaderboard(
        [FromQuery] string mode = "training", [FromQuery] int top = 10)
    {
        try
        {
            var leaders = await _context.Leaderboard
                .Where(l => l.Mode == mode)
                .OrderByDescending(l => l.Score)
                .Take(top)
                .Select(l => new
                {
                    l.Id,
                    l.Username,
                    l.Score,
                    l.Mode,
                    l.CompletedAt
                })
                .ToListAsync();

            return Ok(leaders);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("quest/tasks")]
    public ActionResult<List<QuestTask>> GetQuestTasks([FromQuery] int count = 5)
    {
        try
        {
            var tasks = _morseService.GenerateQuestTasks(count);
            return Ok(tasks);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("quest/check")]
    public ActionResult CheckQuestAnswer([FromBody] TrainingAnswer answer)
    {
        try
        {
            var isCorrect = _morseService.CheckTrainingAnswer(answer.MorseCode, answer.UserAnswer);
            return Ok(new { isCorrect });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}