using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CalendarApp.Api.Data;
using CalendarApp.Api.Entities;

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

    // 1. Получить все задачи
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskItem>>> GetTasks()
    {
        return await _context.Tasks
            .Include(t => t.Group)
            .Include(t => t.Users)
            .ToListAsync();
    }

    // 2. Добавить новую задачу
    [HttpPost]
    [Produces("application/json")]
    public async Task<ActionResult<TaskItem>> CreateTask(TaskItem task)
    {
        task.StartAt = DateTime.SpecifyKind(task.StartAt, DateTimeKind.Utc);
        task.EndAt = DateTime.SpecifyKind(task.EndAt, DateTimeKind.Utc);

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