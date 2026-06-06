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
    public async Task<ActionResult<IEnumerable<TaskDto>>> GetTasks()
    {
        var tasks = await _context.Tasks
            .Include(t => t.Group)
            .Include(t => t.Users)
            .ToListAsync();
        
        var taskDtos = tasks.Select(t => new TaskDto
        {
            Id = t.Id,
            Title = t.Title,
            Description = t.Description,
            StartAt = t.StartAt,
            EndAt = t.EndAt,
            IsExternal = t.IsExternal,
            GroupId = t.GroupId,
            UserIds = t.Users.Select(u => u.Id).ToList()
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

        // Маппинг из DTO в сущность БД
        var task = new TaskItem
        {
            Title = dto.Title,
            Description = dto.Description,
            StartAt = DateTime.SpecifyKind(dto.StartAt, DateTimeKind.Utc),
            EndAt = DateTime.SpecifyKind(dto.EndAt, DateTimeKind.Utc),
            IsExternal = dto.IsExternal,
            GroupId = dto.GroupId
        };

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