using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CalendarApp.Api.Data;
using CalendarApp.Api.Entities;
using CalendarApp.Api.DTOs;

namespace CalendarApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _context;

    public TasksController(AppDbContext context)
    {
        _context = context;
    }

    // 1. Получить все задачи (Возвращаем TaskDto)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetTasks()
    {
        var tasks = await _context.Tasks
            .Include(t => t.Group)
            .Include(t => t.Users)
            .ToListAsync();
        
        var taskDtos = tasks.Select(t => new
        {
            Id = t.Id,
            Title = t.Title,
            Description = t.Description,
            StartAt = t.StartAt,
            EndAt = t.EndAt,
            IsExternal = t.IsExternal,
            GroupId = t.GroupId,
            assignedUsers = t.Users.Select(u => new 
            {
                id = u.Id,
                name = u.Name,
                email = u.Email
            }).ToList()
        }).ToList();

        return Ok(taskDtos);
    }

    // 2. Добавить новую задачу (Принимаем CreateTaskDto)
    [HttpPost]
    public async Task<ActionResult<TaskItem>> CreateTask(CreateTaskDto dto)
    {
        // Бизнес-валидация дат
        if (dto.EndAt < dto.StartAt)
        {
            return BadRequest(new { message = "Дата окончания не может быть раньше даты начала" });
        }

        // ИСПРАВЛЕНИЕ ВРЕМЕНИ:
        // Поскольку фронтенд присылает ISO-строку с часовым поясом, .NET парсит её в dto.StartAt.
        // Метод .ToUniversalTime() честно переведет локальные 10:15 (например, +5) в реальное UTC время (05:15).
        // В базу запишется правильная точка во времени, и при чтении сдвига больше не будет!
        var startUtc = dto.StartAt.ToUniversalTime();
        var endUtc = dto.EndAt.ToUniversalTime();

        // Маппинг из DTO в сущность БД
        var task = new TaskItem
        {
            Title = dto.Title,
            Description = dto.Description,
            StartAt = startUtc,
            EndAt = endUtc,
            IsExternal = dto.IsExternal,
            GroupId = dto.GroupId
        };

        // ИСПРАВЛЕНИЕ ИСПОЛНИТЕЛЕЙ:
        // Проверяем, пришли ли ID пользователей из CreateTaskDto (которое мы обновили ранее)
        if (dto.UserIds != null && dto.UserIds.Any())
        {
            // Находим пользователей в бд по их ID
            var assignedUsers = await _context.Users
                .Where(u => dto.UserIds.Contains(u.Id))
                .ToListAsync();

            // Привязываем их к навигационному свойству сущности TaskItem
            task.Users = assignedUsers;
        }

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        return Ok(task);
    }

    // 3. Удалить задачу по Id
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound();

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}